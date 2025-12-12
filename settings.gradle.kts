rootProject.name = "stock-analytics-app"

include("back-end:auth-service")
project(":back-end:auth-service").projectDir = file("back-end/auth-service")

include("back-end:gateway")
project(":back-end:gateway").projectDir = file("back-end/gateway")

include("back-end:eureka-server")
project(":back-end:eureka-server").projectDir = file("back-end/eureka-server")

include("back-end:finance-service")
project(":back-end:finance-service").projectDir = file("back-end/finance-service")

include("back-end:portfolio-service")
project(":back-end:portfolio-service").projectDir = file("back-end/portfolio-service")
