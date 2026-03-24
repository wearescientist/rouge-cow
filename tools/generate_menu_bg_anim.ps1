Add-Type -AssemblyName System.Drawing

$dir = 'e:\AI\game\rougelike-cow\assets\sprites\ui\menu_bg_anim'
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

function C([int]$r,[int]$g,[int]$b,[int]$a=255){ [System.Drawing.Color]::FromArgb($a,$r,$g,$b) }

function FillSky($g,[int]$w,[int]$h,[int]$phase){
    $top = C 9 22 42
    $mid = C 18 38 70
    $bot = C 28 58 54
    for($y=0;$y -lt $h;$y++){
        $t = $y / [double]($h - 1)
        if($t -lt 0.55){
            $k = $t / 0.55
            $r = [int]($top.R + ($mid.R - $top.R) * $k)
            $g2 = [int]($top.G + ($mid.G - $top.G) * $k)
            $b = [int]($top.B + ($mid.B - $top.B) * $k)
        } else {
            $k = ($t - 0.55) / 0.45
            $r = [int]($mid.R + ($bot.R - $mid.R) * $k)
            $g2 = [int]($mid.G + ($bot.G - $mid.G) * $k)
            $b = [int]($mid.B + ($bot.B - $mid.B) * $k)
        }
        $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $r $g2 $b)),0,$y,$w,1)
    }

    # distant haze band
    $haze = New-Object System.Drawing.Drawing2D.GraphicsPath
    $haze.AddEllipse(-120,300,1840,240)
    $hb = New-Object System.Drawing.Drawing2D.PathGradientBrush($haze)
    $hb.CenterColor = C 170 190 176 32
    $hb.SurroundColors = @([System.Drawing.Color]::FromArgb(0,0,0,0))
    $g.FillPath($hb,$haze)

    # sparse stars with slight twinkle
    $rnd = New-Object System.Random (8118 + $phase)
    for($i=0;$i -lt 130;$i++){
        $x = $rnd.Next(40,$w-40)
        $y = $rnd.Next(18,360)
        $a = $rnd.Next(70,170)
        if((($i+$phase) % 5) -eq 0){ $a = [int]($a * 0.55) }
        $s = $rnd.Next(1,3)
        $g.FillEllipse((New-Object System.Drawing.SolidBrush (C 230 240 226 $a)),$x,$y,$s,$s)
    }
}

function DrawGround($g,[int]$w,[int]$h,[int]$phase){
    # far meadow
    $rectFar = New-Object System.Drawing.Rectangle 0,430,$w,220
    $lgFar = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rectFar,(C 22 74 46),(C 16 58 38),90)
    $g.FillRectangle($lgFar,$rectFar)

    # near meadow
    $rectNear = New-Object System.Drawing.Rectangle 0,620,$w,280
    $lgNear = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rectNear,(C 18 60 41),(C 10 38 30),90)
    $g.FillRectangle($lgNear,$rectNear)

    # grass texture strokes
    $rnd = New-Object System.Random (9921 + $phase)
    for($i=0;$i -lt 2200;$i++){
        $x = $rnd.Next(0,$w)
        $y = $rnd.Next(520,890)
        $len = $rnd.Next(3,11)
        $drift = [int](2 * [Math]::Sin(($phase*0.7) + ($x * 0.01)))
        $c1 = 70 + $rnd.Next(0,40)
        $c2 = 105 + $rnd.Next(0,55)
        $a = 25 + $rnd.Next(0,45)
        $p = New-Object System.Drawing.Pen (C 44 $c2 $c1 $a),1
        $g.DrawLine($p,$x,$y,$x+$drift,$y-$len)
        $p.Dispose()
    }

    # center menu readability zone (very subtle)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush (C 16 36 34 36)),610,450,380,360)
}

function DrawCowBack($g,[int]$x,[int]$y,[int]$phase){
    $bob = [int](2 * [Math]::Sin(($phase/8.0) * [Math]::PI * 2))
    $bodyPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $bodyPath.AddEllipse($x,$y+$bob,190,170)
    $headPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $headPath.AddEllipse($x+45,$y-95+$bob,100,82)

    $bb = New-Object System.Drawing.Drawing2D.PathGradientBrush($bodyPath)
    $bb.CenterColor = C 240 238 244
    $bb.SurroundColors = @((C 172 168 188))
    $g.FillPath($bb,$bodyPath)

    $hb = New-Object System.Drawing.Drawing2D.PathGradientBrush($headPath)
    $hb.CenterColor = C 234 232 240
    $hb.SurroundColors = @((C 166 162 182))
    $g.FillPath($hb,$headPath)

    $outline = New-Object System.Drawing.Pen (C 34 36 50),4
    $g.DrawPath($outline,$bodyPath)
    $g.DrawPath($outline,$headPath)

    # horns
    $horn = New-Object System.Drawing.Pen (C 214 176 116),8
    $horn.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $horn.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawBezier($horn,$x+66,$y-80+$bob,$x+45,$y-112+$bob,$x+34,$y-118+$bob,$x+22,$y-127+$bob)
    $g.DrawBezier($horn,$x+124,$y-80+$bob,$x+145,$y-112+$bob,$x+156,$y-118+$bob,$x+168,$y-127+$bob)

    # legs and tail
    $legBrush = New-Object System.Drawing.SolidBrush (C 52 56 74)
    $g.FillRectangle($legBrush,$x+36,$y+151+$bob,30,36)
    $g.FillRectangle($legBrush,$x+122,$y+151+$bob,30,36)
    $tailPen = New-Object System.Drawing.Pen (C 58 58 70),6
    $g.DrawBezier($tailPen,$x+180,$y+72+$bob,$x+198,$y+96+$bob,$x+192,$y+118+$bob,$x+178,$y+132+$bob)
}

function DrawAbyss($g,[int]$x,[int]$y,[int]$phase){
    $ring1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $ring1.AddEllipse($x,$y,290,128)
    $r1 = New-Object System.Drawing.Drawing2D.PathGradientBrush($ring1)
    $r1.CenterColor = C 18 26 35
    $r1.SurroundColors = @((C 14 20 28))
    $g.FillPath($r1,$ring1)

    $ring2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $ring2.AddEllipse($x+34,$y+22,224,82)
    $r2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($ring2)
    $r2.CenterColor = C 8 10 14
    $r2.SurroundColors = @((C 14 16 20))
    $g.FillPath($r2,$ring2)

    # living mycelium edge
    $pulse = [int](5 * [Math]::Sin(($phase/8.0) * [Math]::PI * 2))
    $penA = New-Object System.Drawing.Pen (C (220+$pulse) (230+$pulse) (222+$pulse) 200),3
    $penB = New-Object System.Drawing.Pen (C 178 194 182 165),2
    for($i=0;$i -lt 12;$i++){
        $sx = $x + 82 + $i*8
        $sy = $y + 62 + ($i % 3)
        $mx = $sx + 14
        $my = $sy - 22 - ($i % 2) * 4
        $ex = $sx + 30 + ($i % 2) * 5
        $ey = $sy - 32 - ($i % 3) * 3
        $g.DrawBezier($penA,$sx,$sy,$mx,$my,$mx+8,$my-4,$ex,$ey)
        $g.DrawBezier($penB,$sx+2,$sy+1,$mx+1,$my+1,$mx+10,$my-2,$ex+2,$ey+1)
    }

    # drifting spores
    $rnd = New-Object System.Random (4330 + $phase)
    for($i=0;$i -lt 38;$i++){
        $px = $rnd.Next($x+60,$x+250)
        $py = $rnd.Next($y-30,$y+70)
        $a = $rnd.Next(45,130)
        $s = $rnd.Next(2,5)
        $g.FillEllipse((New-Object System.Drawing.SolidBrush (C 228 236 226 $a)),$px,$py,$s,$s)
    }
}

function DrawVillage($g,[int]$phase){
    function House($g,[int]$x,[int]$y,[bool]$broken,[bool]$infect,[int]$phase){
        $wall = New-Object System.Drawing.SolidBrush (C 126 130 143)
        $wall2 = New-Object System.Drawing.SolidBrush (C 92 96 112)
        $roof = New-Object System.Drawing.SolidBrush (C 154 92 74)
        $win = New-Object System.Drawing.SolidBrush (C 58 66 85)
        $o = New-Object System.Drawing.Pen (C 30 32 44),3
        $g.FillRectangle($wall,$x,$y,92,56)
        $g.FillRectangle($wall2,$x+4,$y+30,84,26)
        $g.FillRectangle($roof,$x-4,$y-14,100,16)
        $g.FillRectangle($win,$x+30,$y+24,25,18)
        $g.DrawRectangle($o,$x,$y,92,56)
        if($broken){
            $cr = New-Object System.Drawing.SolidBrush (C 44 40 38)
            $g.FillRectangle($cr,$x+64,$y+6,28,21)
            $g.FillRectangle($cr,$x+48,$y+0,12,8)
        }
        if($infect){
            $wig = [int](2 * [Math]::Sin(($phase/8.0) * [Math]::PI * 2))
            $pn = New-Object System.Drawing.Pen (C 226 234 222 200),3
            $g.DrawBezier($pn,$x+8,$y+54,$x+16,$y+40,$x+24+$wig,$y+34,$x+34,$y+28)
            $g.DrawBezier($pn,$x+26,$y+54,$x+34,$y+42,$x+44+$wig,$y+36,$x+52,$y+30)
            $g.DrawBezier($pn,$x+44,$y+54,$x+52,$y+42,$x+62+$wig,$y+36,$x+72,$y+30)
        }
    }

    House $g 1180 404 $false $true $phase
    House $g 1268 440 $true $true $phase
    House $g 1358 392 $false $false $phase
    House $g 1454 430 $true $false $phase
}

function AddVignette($bmp){
    $w = $bmp.Width; $h = $bmp.Height
    for($y=0;$y -lt $h;$y+=2){
        for($x=0;$x -lt $w;$x+=2){
            $nx = ($x - ($w/2.0)) / ($w/2.0)
            $ny = ($y - ($h/2.0)) / ($h/2.0)
            $d = [Math]::Sqrt($nx*$nx + $ny*$ny)
            if($d -gt 0.88){
                $c = $bmp.GetPixel($x,$y)
                $m = [Math]::Max(0.58, 1.0 - ($d-0.88)*1.4)
                $dark = [System.Drawing.Color]::FromArgb(255,[int]($c.R*$m),[int]($c.G*$m),[int]($c.B*$m))
                $bmp.SetPixel($x,$y,$dark)
            }
        }
    }
}

for($f=0;$f -lt 8;$f++){
    $w = 1600; $h = 900
    $bmp = New-Object System.Drawing.Bitmap $w,$h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    FillSky $g $w $h $f
    DrawGround $g $w $h $f
    DrawAbyss $g 860 556 $f
    DrawVillage $g $f
    DrawCowBack $g 205 586 $f

    AddVignette $bmp

    $g.Dispose()
    $out = Join-Path $dir ("frame_{0:D2}.png" -f $f)
    $bmp.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Write-Output 'menu_bg_anim_realistic_8frames_generated'
