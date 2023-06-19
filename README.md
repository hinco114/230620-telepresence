# 230620 판교소모임 Telepresence 발표

## 발표자료
[PPT](https://docs.google.com/presentation/d/1sbDeGQ0whx81XpIB55LkeOxLqa0n9422nJXl784N8Do/edit?usp=sharing)

## 실습을 위해 필요한 것들
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) (테스트환경 2.11.4)
- [Terraform](https://www.terraform.io/downloads.html) (테스트환경 1.5.0)
- [Docker](https://docs.docker.com/get-docker/) (테스트환경 23.0.5)
- [Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) (테스트환경 1.26.3)
- [Telepresence](https://www.telepresence.io/reference/install) (테스트환경 2.14.0)
- [MongoShell](https://www.mongodb.com/docs/mongodb-shell/install/#std-label-mdb-shell-install) (테스트환경 1.10.0)

## 실습 순서
AWS CLI 사용을 위한 AWS Profile 이 필요합니다.

테스트 할 수 있는 EKS Cluster 가 있다면 3번까지 건너뛰고 4번부터 진행하시면 됩니다.
1. Terraform 으로 필요한 AWS 리소스 생성 (VPC, ElastiCache)
```shell
cd $(git rev-parse --show-toplevel)/terraform
terraform init
# VPC 생성
terraform apply -target=module.vpc
# ElastiCache 생성 (8분가량 소요, 아래 명령어 실행 후 아래 2번 명령어 병렬 실행하여 시간 아낍시다!)
terraform apply -target=aws_elasticache_cluster.demo_cluster
```
 
2. Kubernetes Cluster 생성
```shell
cd $(git rev-parse --show-toplevel)/terraform/configs

# eks-cluster-config.yaml 파일 내용 수정
vi eks-cluster-config.yaml
# vpc 의 subnet
# managedNodeGroups 의 subnet 부분
# managedNodeGroups 의 securityGroups 부분

eksctl create cluster -f eks-cluster-config.yaml
```

3. kubectl 명령어 정상 동작 확인
```shell
kubectl get nodes
```

4. k8s Manifest Apply
```shell
# git root 폴더로 이동
cd $(git rev-parse --show-toplevel)/k8s
kubectl apply -f ./
```

5. DB, Redis 접근 확인
```shell
# IP 는 node IP 사용
telnet <node-ip> 30000
mongosh --host <node-ip> --port 30000

telnet mongodb.default.svc.cluster.local 27017
mongosh --host mongodb.default.svc.cluster.local --port 27017

telnet elasticache-cluster-demo.2lqmsy.0001.apn2.cache.amazonaws.com 6379
redis-cli -h elasticache-cluster-demo.2lqmsy.0001.apn2.cache.amazonaws.com -p 6379
```

여기까지가 Telepresence 없이 사용되는 일반적인 환경입니다.  
MongoDB, Redis 접속을 위해선 Public Endpoint 를 통해야 하며, AWS SG 에서도 Public IP 에 대한 접근을 허용해야 합니다.  
그럼 이제 Telepresence 를 통해 Private Endpoint 를 통해 접근해보겠습니다.

6. Telepresence 설치
```shell
telepresence helm install
# 아래 메시지가 출력되면 성공
# Traffic Manager installed successfully
telepresence status
telepresence connect
telepresence status
```

7. Private Endpoint 접근 확인
```shell
telnet mongodb.default.svc.cluster.local 27017
# mongodb 접속 성공

telnet elasticache-cluster-demo.2lqmsy.0001.apn2.cache.amazonaws.com 6379
# redis 접속 실패
```
단순히 `telepresence connect` 명령만 했음에도 k8s Cluster 내의 MongoDB Service 에 접근 성공하였습니다.

8. Telepresence also-proxy 설정  
   [also-proxy](https://www.getambassador.io/docs/telepresence/latest/reference/config#values-2) 설정 참고
```yaml
# vi ~/.kube/config

clusters:
  - cluster:
      server: SERVER_URL
      extensions:
        - name: telepresence.io
          extension:
            also-proxy: [10.10.0.0/16]
```
```shell
# telepresence 재 접속
telepresence quit
telepresence connect
```

8. 접속 확인 및 실제 Application 실행
```shell
telnet elasticache-cluster-demo.2lqmsy.0001.apn2.cache.amazonaws.com 6379
# redis 접속 성공

cd $(git rev-parse --show-toplevel)/application/web
export NODE_IP=<node-ip>
export REDIS_ENDPOINT=redis://elasticache-cluster-demo.2lqmsy.0001.apn2.cache.amazonaws.com:6379
npm start
curl localhost:3000
```
모든 Private 환경에 접속 가능하며, 실제 Application 을 실행하여 확인할 수 있습니다.

9. telepresence intercept 실습
```shell
telepresence list
telepresence intercept web --port 3000
telepresence status
curl $NODE_IP:30001
telepresence leave web
curl $NODE_IP:30001
```

intercept 여부에 따라 traffic 이 전달되는지 확인할 수 있습니다.

10. Telepresence 종료
```shell
telepresence quit
```

11. 리소스 정리하기 (잊지말자!)
```shell
cd $(git rev-parse --show-toplevel)/terraform
eksctl delete cluster -f configs/eks-cluster-config.yaml
terraform destroy
```
