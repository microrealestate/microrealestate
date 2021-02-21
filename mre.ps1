# PROD_COMPOSE_FILES=@("monitoring", "microservices.base", "microservices.prod")
$PROD_COMPOSE_FILES = @("microservices.base", "microservices.prod")
$DEV_COMPOSE_FILES = @("microservices.base", "microservices.dev")

$prod_compose_files_argument = $PROD_COMPOSE_FILES | ForEach-Object {" -f ./docker-compose.$_.yml"}
$dev_compose_files_argument = $DEV_COMPOSE_FILES | ForEach-Object {" -f ./docker-compose.$_.yml"}

$prod_compose_files_argument = -join $prod_compose_files_argument
$dev_compose_files_argument = -join $dev_compose_files_argument

# environment variables are in *.env files
function Initialize-Environment($envFile) {
    if (Test-Path $envFile -PathType Leaf) {
        foreach ($line in Get-Content $envFile) {
            # If line is a comment or null/whitespace/newline skip.
            if ($line.StartsWith("#") -or [String]::IsNullOrWhiteSpace($line)) {
                continue
            } else {
                # Split the variable name and variable.
                # (matching only first '=' aka return exactly 2 sub strings)
                $lineSplit = $line -split '=',2
                # Add it as environment variable
                [System.Environment]::SetEnvironmentVariable($lineSplit[0], $lineSplit[1])
            }
        }
    }
}

function Confirm-Development() {
    Write-Output "checking dev config..."
    Invoke-Expression -Command "docker-compose $dev_compose_files_argument config"
}

function Confirm-Production() {
    Write-Output "checking prod config..."
    Invoke-Expression -Command "docker-compose $prod_compose_files_argument config"
}

function Start-Development() {
    Write-Output "Starting microrealestate..."
    Invoke-Expression -Command "docker-compose $dev_compose_files_argument rm --stop --force"
    Invoke-Expression -Command "docker-compose $dev_compose_files_argument up --build --remove-orphans"
}

function Read-Environment() {
    Invoke-Expression -Command "docker-compose $prod_compose_files_argument ps"
}

function Build-Environment($1) {
    Write-Output "Building microrealestate $1..."
    Invoke-Expression -Command "docker-compose $prod_compose_files_argument rm --stop --force $1"
    Invoke-Expression -Command "docker-compose $prod_compose_files_argument build --no-cache $1"
}

function Start-Environment($1) {
    Write-Output "Starting microrealestate $1..."
#    if (-not (Test-Path './data/elasticsearch' -PathType Container)) {
#        New-Item -Path './data/' -Name "elasticsearch" -ItemType "directory"
#    }
    # Verify ./data is present, if not, create it.
    if (-not (Test-Path './data' -PathType Container)) {
        New-Item -Path './' -Name "data" -ItemType "directory"
    }
    if (-not (Test-Path './data/mongodb' -PathType Container)) {
        New-Item -Path './data/' -Name "mongodb" -ItemType "directory"
    }
    if ( -not ([String]::IsNullOrWhiteSpace($1))) {
        Invoke-Expression -Command "docker-compose $prod_compose_files_argument up -d $1"
    } else {
        Invoke-Expression -Command "docker-compose $prod_compose_files_argument up -d --force-recreate --remove-orphans"
    }

    if ($LASTEXITCODE -ne 0) {
        Stop-Environment
        Write-Output "ERROR: Fail to start microrealestate $1"
    } else {
        if (([String]::IsNullOrWhiteSpace($1))) {
            Read-Environment
            Write-Output ""
            Write-Output "Front-end               http://localhost:$Env:NGINX_PORT"
            # Write-Output "kibana                http://localhost:$Env:KIBANA_PORT"
            # Write-Output "cadvisor              http://localhost:$Env:CADVISOR_PORT"
            # Write-Output "rabbitmq Management   http://localhost:$Env:RABBITMQ_MANAGEMENT_PORT"
        }
    }
    return $LASTEXITCODE
}

function Stop-Environment {
    Write-Output "Stopping microrealestate $1..."
    Invoke-Expression -Command "docker-compose $prod_compose_files_argument rm -sf $1"
}

function Write-Help 
{
    Write-Output "Usage: $0 [option...] {dev|build|status|start|stop|restart|config-dev|config-prod}"
}

switch ($args[0]) {
    config-dev { 
        Initialize-Environment dev.env
        Initialize-Environment .env
        Confirm-Development
    }
    config-prod {
        Initialize-Environment prod.env
        Initialize-Environment .env
        Confirm-Production
    }
    dev {
        Initialize-Environment dev.env
        Initialize-Environment .env
        Start-Development
    }
    status {
        Initialize-Environment prod.env
        Initialize-Environment .env
        Read-Environment
    }
    build {
        Initialize-Environment prod.env
        Initialize-Environment .env
        Build-Environment $args[1]
    }
    start {
        Initialize-Environment prod.env
        Initialize-Environment .env
        Start-Environment $args[1]
    }
    stop {
        Initialize-Environment prod.env
        Initialize-Environment .env
        Stop-Environment $args[1]
    }
    restart {
        Initialize-Environment prod.env
        Initialize-Environment .env
        Start-Environment $args[1]
    }
    -h {
        Write-Help
        Exit 0
    }
    Default {
        Write-Help
        Exit 1
    }
}