bucket         = "pgmonitor-terraform-state-dev"
key            = "dev/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "pgmonitor-terraform-locks-dev"
