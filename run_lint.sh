for dir in backend game signaling common; do
  npm run lint --prefix $dir
done
