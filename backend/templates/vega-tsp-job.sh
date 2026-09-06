#!/bin/bash
#SBATCH --job-name=pga-tsp
#SBATCH --partition=gpu
#SBATCH --ntasks=1
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --output=pga-tsp.out
#SBATCH --gpus-per-task=1
#SBATCH --gres=gpu:1

module load OpenMPI/4.1.4-NVHPC-22.7-CUDA-11.7.0

srun --mpi=pmix \
../pga-tsp --fine --global --islands 32 --population 100 \
--iterations 250 --migrations 100 --superemigration-period 10 --stalled-iterations 50 --stalled-migrations 20 \
--crossover 0.15 --mutation 0.15 --elitism --history history/iteration_ PLACEHOLDER.tsp
