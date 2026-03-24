Add-Type -AssemblyName System.Drawing

$uiDir = 'e:\AI\game\rougelike-cow\assets\sprites\ui'
if (!(Test-Path $uiDir)) { New-Item -ItemType Directory -Path $uiDir | Out-Null }

function New-Bmp([int]$w,[int]$h) {
    return (New-Object System.Drawing.Bitmap $w,$h)
}

function C([int]$r,[int]$g,[int]$b,[int]$a=255) {
    return [System.Drawing.Color]::FromArgb($a,$r,$g,$b)
}

function FillRect($bmp,[int]$x,[int]$y,[int]$w,[int]$h,$col) {
    for($yy=$y; $yy -lt ($y+$h); $yy++){
        if($yy -lt 0 -or $yy -ge $bmp.Height){ continue }
        for($xx=$x; $xx -lt ($x+$w); $xx++){
            if($xx -lt 0 -or $xx -ge $bmp.Width){ continue }
            $bmp.SetPixel($xx,$yy,$col)
        }
    }
}

function DrawRect($bmp,[int]$x,[int]$y,[int]$w,[int]$h,[int]$t,$col) {
    FillRect $bmp $x $y $w $t $col
    FillRect $bmp $x ($y+$h-$t) $w $t $col
    FillRect $bmp $x $y $t $h $col
    FillRect $bmp ($x+$w-$t) $y $t $h $col
}

function AddNoise($bmp,[int]$count,[int]$min,[int]$max,[bool]$greenBias=$false){
    $rnd = New-Object System.Random
    for($i=0;$i -lt $count;$i++){
        $x = $rnd.Next(0,$bmp.Width)
        $y = $rnd.Next(0,$bmp.Height)
        $base = $bmp.GetPixel($x,$y)
        $d = $rnd.Next($min,$max)
        $extraG = $d
        if($greenBias){ $extraG = [int]($d*1.3) }
        $nr = [Math]::Max(0,[Math]::Min(255,$base.R + $d))
        $ng = [Math]::Max(0,[Math]::Min(255,$base.G + $extraG))
        $nb = [Math]::Max(0,[Math]::Min(255,$base.B + [int]($d*0.7)))
        $bmp.SetPixel($x,$y,[System.Drawing.Color]::FromArgb($base.A,$nr,$ng,$nb))
    }
}

function DrawVeins($bmp,[int]$paths,[int]$steps,$col,[int]$thick=1){
    $rnd = New-Object System.Random
    for($p=0;$p -lt $paths;$p++){
        $x = $rnd.Next(0,$bmp.Width)
        $y = $rnd.Next(0,$bmp.Height)
        $dx = $rnd.Next(-1,2)
        $dy = $rnd.Next(-1,2)
        if($dx -eq 0 -and $dy -eq 0){ $dx = 1 }
        for($s=0;$s -lt $steps;$s++){
            FillRect $bmp ($x-[int]($thick/2)) ($y-[int]($thick/2)) $thick $thick $col
            if($rnd.NextDouble() -lt 0.28){ $dx = $rnd.Next(-1,2) }
            if($rnd.NextDouble() -lt 0.28){ $dy = $rnd.Next(-1,2) }
            if($dx -eq 0 -and $dy -eq 0){ $dx = 1 }
            $x += $dx
            $y += $dy
            if($x -lt 1){ $x = 1; $dx = 1 }
            if($x -gt $bmp.Width-2){ $x = $bmp.Width-2; $dx = -1 }
            if($y -lt 1){ $y = 1; $dy = 1 }
            if($y -gt $bmp.Height-2){ $y = $bmp.Height-2; $dy = -1 }
        }
    }
}

function DrawParasiteEye($bmp,[int]$cx,[int]$cy,[int]$r){
    for($y=-$r;$y -le $r;$y++){
        for($x=-$r;$x -le $r;$x++){
            $d = [Math]::Sqrt($x*$x+$y*$y)
            if($d -le $r){
                $px=$cx+$x; $py=$cy+$y
                if($px -ge 0 -and $px -lt $bmp.Width -and $py -ge 0 -and $py -lt $bmp.Height){
                    if($d -lt ($r*0.45)) { $bmp.SetPixel($px,$py,(C 255 120 56 210)) }
                    elseif($d -lt ($r*0.72)) { $bmp.SetPixel($px,$py,(C 255 176 92 180)) }
                    else { $bmp.SetPixel($px,$py,(C 70 255 120 95)) }
                }
            }
        }
    }
}

function Save($bmp,$name){
    $path = Join-Path $uiDir $name
    $bmp.Save($path,[System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$panel = New-Bmp 96 96
FillRect $panel 0 0 96 96 (C 11 14 24 255)
FillRect $panel 4 4 88 88 (C 23 29 43 245)
FillRect $panel 8 8 80 80 (C 33 42 58 235)
DrawRect $panel 2 2 92 92 2 (C 13 17 26 255)
DrawRect $panel 5 5 86 86 2 (C 94 116 86 255)
DrawRect $panel 8 8 80 80 1 (C 164 193 118 230)
DrawVeins $panel 11 75 (C 96 138 86 125) 1
DrawParasiteEye $panel 20 20 6
DrawParasiteEye $panel 76 72 5
AddNoise $panel 1800 -20 18 $true
Save $panel 'ui_panel_9slice.png'

function MakeButton($name,$base,$edge,$highlight,$vein){
    $b = New-Bmp 192 56
    FillRect $b 0 0 192 56 $base
    FillRect $b 3 3 186 50 (C 30 38 54 255)
    FillRect $b 6 6 180 44 (C 46 58 74 245)
    DrawRect $b 1 1 190 54 2 $edge
    DrawRect $b 5 5 182 46 1 $highlight
    DrawVeins $b 5 120 $vein 1
    DrawParasiteEye $b 170 14 4
    AddNoise $b 1300 -15 15 $true
    Save $b $name
}
MakeButton 'ui_button_normal.png' (C 20 26 40 255) (C 88 114 92 255) (C 168 196 126 220) (C 76 125 87 120)
MakeButton 'ui_button_hover.png'  (C 28 34 50 255) (C 124 162 120 255) (C 205 234 154 245) (C 98 154 109 145)
MakeButton 'ui_button_pressed.png' (C 14 18 30 255) (C 70 92 72 255) (C 138 166 102 210) (C 64 104 76 110)

function MakeSlot($name,$inner,$edge,$sigil){
    $s = New-Bmp 64 64
    FillRect $s 0 0 64 64 (C 10 12 20 255)
    FillRect $s 3 3 58 58 (C 20 25 36 255)
    DrawRect $s 2 2 60 60 2 $edge
    DrawRect $s 7 7 50 50 1 (C 155 181 121 220)
    FillRect $s 11 11 42 42 $inner
    DrawVeins $s 4 55 (C 88 130 86 120) 1
    FillRect $s 30 30 4 4 $sigil
    AddNoise $s 500 -18 18 $true
    Save $s $name
}
MakeSlot 'ui_slot_item.png' (C 35 46 59 235) (C 108 138 100 255) (C 250 196 96 255)
MakeSlot 'ui_slot_weapon.png' (C 44 44 64 235) (C 124 141 166 255) (C 178 212 255 255)
MakeSlot 'ui_slot_passive.png' (C 48 40 58 235) (C 140 120 166 255) (C 220 166 255 255)
MakeSlot 'ui_slot_weapon_active.png' (C 50 62 66 245) (C 120 182 160 255) (C 138 255 210 255)

$bgPath = 'e:\AI\game\rougelike-cow\assets\sprites\ui\bg_parasite_cavern.png'
$bg = New-Bmp 1600 900
FillRect $bg 0 0 1600 900 (C 6 10 18 255)
for($y=0;$y -lt 900;$y++){
    for($x=0;$x -lt 1600;$x++){
        $nx = ($x-800)/800.0
        $ny = ($y-460)/460.0
        $d = [Math]::Sqrt($nx*$nx + $ny*$ny)
        $v = [Math]::Max(0,1.0-$d)
        $g = [int](16 + 64*$v)
        $b = [int](24 + 52*$v)
        $r = [int](8 + 20*$v)
        $bg.SetPixel($x,$y,(C $r $g $b 255))
    }
}
for($i=0;$i -lt 26;$i++){
    $rx = 40 + $i*60
    DrawRect $bg $rx 70 44 760 2 (C 22 45 36 120)
}
DrawVeins $bg 140 280 (C 76 130 96 95) 2
DrawVeins $bg 180 190 (C 120 60 42 55) 1
$rnd = New-Object System.Random
for($i=0;$i -lt 24;$i++){
    $cx = $rnd.Next(80,1520)
    $cy = $rnd.Next(120,840)
    $r = $rnd.Next(10,30)
    for($yy=-$r;$yy -le $r;$yy++){
        for($xx=-$r;$xx -le $r;$xx++){
            $d = [Math]::Sqrt($xx*$xx+$yy*$yy)
            if($d -le $r){
                $px=$cx+$xx; $py=$cy+$yy
                if($px -ge 0 -and $px -lt 1600 -and $py -ge 0 -and $py -lt 900){
                    $a = [int](140 * (1.0 - ($d/$r)))
                    $col = $bg.GetPixel($px,$py)
                    $nr = [Math]::Min(255,$col.R + [int](40 * $a / 140))
                    $ng = [Math]::Min(255,$col.G + [int](22 * $a / 140))
                    $nb = [Math]::Min(255,$col.B + [int](16 * $a / 140))
                    $bg.SetPixel($px,$py,[System.Drawing.Color]::FromArgb(255,$nr,$ng,$nb))
                }
            }
        }
    }
}
AddNoise $bg 180000 -10 10 $true
$bg.Save($bgPath,[System.Drawing.Imaging.ImageFormat]::Png)
$bg.Dispose()

Write-Output 'generated_ui_and_bg_ok'
