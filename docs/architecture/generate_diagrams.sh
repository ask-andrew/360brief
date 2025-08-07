#!/bin/bash

# Create output directory
mkdir -p generated

# Generate images for all .puml files
for file in *.puml; do
  echo "Generating image for $file..."
  curl -X POST --data-binary @"$file" http://localhost:8080/form -o "generated/$(basename "$file" .puml).png"
done

echo "All diagrams have been generated in the 'generated' directory"
ls -la generated/
