for dir in backend game signaling common; do
  cd $dir
  npm run lint
  cd -
done
