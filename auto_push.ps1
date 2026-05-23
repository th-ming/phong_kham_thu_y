git.exe add .
git.exe commit -m "Auto commit"
$branch = git.exe branch --show-current
git.exe push origin $branch
