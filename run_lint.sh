set -e
for dir in backend controller game common; do
  npm run lint --prefix $dir
done
