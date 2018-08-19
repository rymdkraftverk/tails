for dir in backend controller game signaling common; do
  cd $dir
  npm run lint
  cd -
done
