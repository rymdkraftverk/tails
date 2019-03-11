for dir in backend controller game signaling common; do
  npm run lint --prefix $dir
done
