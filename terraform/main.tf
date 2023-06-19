module "vpc" {
  source = "./modules/vpc"

  tag = var.tag
}

resource "aws_elasticache_subnet_group" "subnet_group" {
  name       = "my-vpc-subnet"
  subnet_ids = module.vpc.private_subnet
}

data "http" "my_ip" {
  url = "http://whatismyip.akamai.com/"
}

resource "aws_security_group" "allow_my_ip" {
  name        = "allow_my_ip"
  description = "Allow inbound traffic from my IP"
  vpc_id      = module.vpc.vpc

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [
      "${data.http.my_ip.response_body}/32",
    ]
  }
}

resource "aws_elasticache_cluster" "demo_cluster" {
  cluster_id           = "elasticache-cluster-demo"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis3.2"
  engine_version       = "3.2.10"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.subnet_group.name
  security_group_ids   = [aws_security_group.allow_my_ip.id]
}

output "cache_address" {
  value = aws_elasticache_cluster.demo_cluster.cache_nodes.0.address
}
