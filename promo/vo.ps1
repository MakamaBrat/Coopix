# Черновая озвучка рилса голосом Microsoft Irina (ru-RU). Запуск: powershell -File promo\vo.ps1
# Каждая фраза — отдельный WAV в promo/vo/, длительности — в promo/vo/lines.json (по ним строится таймлайн ролика).
Add-Type -AssemblyName System.Speech
$dir = Join-Path $PSScriptRoot "vo"; New-Item -ItemType Directory -Force $dir | Out-Null
$lines = @(
  @{ id = "l01"; t = "Апокалипсис. Связи нет. Зарядки — семь процентов." },
  @{ id = "l02"; t = "Но Телеграм ещё ловит. Открываете Coopix Market — бесплатные игры прямо в чате." },
  @{ id = "l03"; t = "Свайп — в избранное. «Скачать» — и бот присылает игру одним файлом." },
  @{ id = "l04"; t = "Всё. Интернет больше не нужен. Игра работает без сети." },
  @{ id = "l05"; t = "Стик Файт. Волны ботов, пушки, прыжки, замедление. Чистый экшен." },
  @{ id = "l06"; t = "А это Серёга. Серёга выживал. Шёл за водой." },
  @{ id = "l07"; t = "Мы показали Серёге игры." },
  @{ id = "l08"; t = "Мультиплеер по вай-фаю или кю-ар коду. До семи игроков. Без интернета. И всё — бесплатно." },
  @{ id = "l09"; t = "Прошёл день. Неделя. Батарея — один процент." },
  @{ id = "l10"; t = "Ну... если вы и умрёте — то точно не от скуки." },
  @{ id = "l11"; t = "Coopix Market. Ищите в Телеграме." }
)
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("Microsoft Irina Desktop"); $s.Rate = 1; $s.Volume = 100
$out = @()
foreach ($l in $lines) {
  $f = Join-Path $dir ($l.id + ".wav")
  $s.SetOutputToWaveFile($f); $s.Speak($l.t); $s.SetOutputToNull()
  $b = [IO.File]::ReadAllBytes($f); $rate = [BitConverter]::ToInt32($b, 28); $len = $b.Length - 44
  $out += [ordered]@{ id = $l.id; text = $l.t; dur = [math]::Round($len / $rate, 2) }
}
$s.Dispose()
($out | ConvertTo-Json) | Set-Content (Join-Path $dir "lines.json") -Encoding utf8
$out | ForEach-Object { "{0} {1,5}s  {2}" -f $_.id, $_.dur, $_.text }
