bucket         = "pgmonitor-terraform-state-staging"
key            = "staging/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "pgmonitor-terraform-locks-staging"
