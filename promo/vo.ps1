# Черновая озвучка рилса голосом Microsoft Irina (ru-RU). Запуск: powershell -File promo\vo.ps1
# Каждая фраза — отдельный WAV в promo/vo/, длительности — в promo/vo/lines.json (по ним строится таймлайн ролика).
Add-Type -AssemblyName System.Speech
$dir = Join-Path $PSScriptRoot "vo"; New-Item -ItemType Directory -Force $dir | Out-Null
$lines = @(
  @{ id = "c1"; t = "Апокалипсис. Связи нет. Заряда — семь процентов." },
  @{ id = "c2"; t = "Пока ловит — жмёшь «Скачать все игры»." },
  @{ id = "c3"; t = "Бот присылает их файлами. Интернет больше не нужен." },
  @{ id = "c4"; t = "Играешь офлайн. С друзьями — по локальному вай-фаю." },
  @{ id = "c5"; t = "Серёга пошёл за водой." },
  @{ id = "c6"; t = "Не дошёл." },
  @{ id = "c7"; t = "Если и умрёте — то точно не от скуки." },
  @{ id = "c8"; t = "Coopix Market. Ищи в Телеграме." }
)
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("Microsoft Irina Desktop"); $s.Rate = 5; # ~1.5x быстрее $s.Volume = 100
$out = @()
foreach ($l in $lines) {
  $f = Join-Path $dir ($l.id + ".wav")
  $s.SetOutputToWaveFile($f); $s.Speak($l.t); $s.SetOutputToNull()
  $b = [IO.File]::ReadAllBytes($f); $rate = [BitConverter]::ToInt32($b, 28); $len = $b.Length - 44
  $out += [ordered]@{ id = $l.id; text = $l.t; file = $l.id + ".wav"; dur = [math]::Round($len / $rate, 2) }
}
$s.Dispose()
($out | ConvertTo-Json) | Set-Content (Join-Path $dir "lines.json") -Encoding utf8
$out | ForEach-Object { "{0} {1,5}s  {2}" -f $_.id, $_.dur, $_.text }
