output "vpc" {
  value = aws_vpc.main_vpc.id
}

output "private_subnet" {
  value = aws_subnet.private_subnet.*.id
}

output "public_subnet" {
  value = aws_subnet.public_subnet.*.id
}

output "vpc_cidr_block" {
    value = aws_vpc.main_vpc.cidr_block
}
