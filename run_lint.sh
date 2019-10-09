set -e
for dir in controller game common; do
  npm run lint --prefix $dir
done
