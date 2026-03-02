import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    SOLVER_OUTPUT_DIR: str = "solver_output"
    TSP_INPUT_DIR: str = "tsp_input"

    # VEGA Cluster configuration
    VEGA_USER: str = os.getenv("VEGA_USER", "user")
    VEGA_HOST: str = os.getenv("VEGA_HOST", "login.vega.izum.si")
    VEGA_PORT: int = int(os.getenv("VEGA_PORT", "22"))
    VEGA_SSH_KEY: str = os.getenv("VEGA_SSH_KEY", "~/.ssh/id_rsa")
    VEGA_REMOTE_DIR: str = os.getenv("VEGA_REMOTE_DIR", "~/pga-tsp-workspace")


settings = Settings()
