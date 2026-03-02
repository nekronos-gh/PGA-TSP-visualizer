#!/bin/bash
#SBATCH --job-name=pga-tsp
#SBATCH --partition=gpu
#SBATCH --ntasks=4
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=4
#SBATCH --output=pga-tsp.out
#SBATCH --gpus-per-task=1
#SBATCH --gres=gpu:4

rm history/iteration_*

module load CMake/3.23
module load OpenMPI/4.1.4-NVHPC-22.7-CUDA-11.7.0

srun --mpi=pmix \
../pga-tsp --fine --global --islands 8 --population 100 --warps 16 \
--iterations 250 --migrations 100 --superemigration-period 10 --stalled-iterations 50 --stalled-migrations 20 \
--crossover 0.15 --mutation 0.15 --elitism --verbose --history history/iteration_ PLACEHOLDER.tsp result.tour
