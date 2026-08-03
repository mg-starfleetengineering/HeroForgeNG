Attribute VB_Name = "Options"
Option Explicit

Sub DisplayNotes()
  ActiveWorkbook.FollowHyperlink _
      Address:="https://sites.google.com/site/heroforgeanew/supported-books", _
      NewWindow:=True
End Sub

Sub DisplayChangeLog()
  ActiveWorkbook.FollowHyperlink _
      Address:="https://github.com/Heliomance/HeroForge-Anew/blob/master/Changelog.md", _
      NewWindow:=True
End Sub

Sub HPAuto1()
If Range("HRHalfPlus1").Value = True Then
    Range("HR2Thirds").Value = False
    Range("HR3Quarters").Value = False
    'LGHitPoints
End If
End Sub

Sub HPAuto2()
If Range("HR2Thirds").Value = True Then
    Range("HRHalfPlus1").Value = False
    Range("HR3Quarters").Value = False
    'XendrikHitPoints
End If
End Sub

Sub HPAuto3()
If Range("HR3Quarters").Value = True Then
    Range("HRHalfPlus1").Value = False
    Range("HR2Thirds").Value = False
    'ThreeQuarterHitPoints
End If
End Sub
