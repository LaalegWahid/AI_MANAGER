provider "aws" {
  region = var.aws_region
}

module "rds" {
  source = "./modules/rds"

  vpc_id      = var.vpc_id
  subnet_ids  = var.subnet_ids
  db_password = var.db_password
  allowed_ip  = var.allowed_ip
}