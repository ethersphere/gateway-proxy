#!/bin/bash
FILE=random_data_file

while true
do
  dd if=/dev/urandom of=$FILE bs=1600k count=1

  swarm-cli upload --bee-api-url http://localhost:4000  --stamp 0000000000000000000000000000000000000000000000000000000000000000  -q ./$FILE
  # # Just to be sure, let's give the node 2 seconds
  rm $FILE
  sleep 2
  echo "uploaded"
done
