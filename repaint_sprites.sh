#!/usr/bin/env bash

REPAINTS=(
  # color_name:hex
  'turquoise:#009B9D'
  'orange:#FF7300'
  'pink:#FF6DCE'
  'white:#EEEDEF'
  'green:#63C600'
  'yellow:#FFE100'
  'blue:#3E5AFF'
  'red:#F21818'
  'purple:#9300C9'
  'brown:#754701'
)

ASSET_PREFIXES=(circle arrow square)

for repaint in ${REPAINTS[@]}; do
  x=(${repaint//:/ })
  color_name=${x[0]}
  hex=${x[1]}

  for asset_prefix in ${ASSET_PREFIXES[@]}; do
    file_path=game/src/asset/$asset_prefix-$color_name.png
    convert $file_path -fuzz 0% -fill $hex +opaque none $file_path
  done
done

