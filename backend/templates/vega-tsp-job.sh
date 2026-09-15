#!/bin/bash
#SBATCH --job-name=pga-tsp
#SBATCH --partition=gpu
#SBATCH --ntasks=1
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --output=pga-tsp.out
#SBATCH --gpus-per-task=PLACEHOLDER.gpus
#SBATCH --gres=gpu:PLACEHOLDER.gpus

module load OpenMPI/4.1.4-NVHPC-22.7-CUDA-11.7.0

srun --mpi=pmix \
../pga-tsp --fine --global --islands PLACEHOLDER.islands --population PLACEHOLDER.population \
--iterations PLACEHOLDER.iterations --migrations PLACEHOLDER.migrations --superemigration-period PLACEHOLDER.superemigration_period \
--stalled-iterations PLACEHOLDER.stalled_iterations --stalled-migrations PLACEHOLDER.stalled_migrations \
--crossover PLACEHOLDER.crossover --mutation PLACEHOLDER.mutation PLACEHOLDER.elitism \
--history history/iteration_ PLACEHOLDER.tsp
