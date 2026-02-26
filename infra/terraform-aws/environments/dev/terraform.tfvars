environment = "dev"
aws_region  = "us-east-1"

vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

web_task_cpu      = 256
web_task_memory   = 512
api_task_cpu      = 256
api_task_memory   = 512
web_desired_count = 1
api_desired_count = 1
min_capacity      = 1
max_capacity      = 3

db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_name              = "pgmonitor"
