# Lines of Typescript code
cd ts/
dir -Recurse *.ts | Get-Content | Measure-Object -line -word -character
cd ../