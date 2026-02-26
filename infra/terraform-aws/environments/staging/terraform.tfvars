environment = "staging"
aws_region  = "us-east-1"

vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

web_task_cpu      = 512
web_task_memory   = 1024
api_task_cpu      = 512
api_task_memory   = 1024
web_desired_count = 2
api_desired_count = 2
min_capacity      = 1
max_capacity      = 5

db_instance_class    = "db.t3.small"
db_allocated_storage = 50
db_name              = "pgmonitor"
