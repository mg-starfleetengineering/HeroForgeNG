Attribute VB_Name = "Attacks"
Option Explicit

Sub HideAttackInfo()
'
' HideAttackInfo Macro
' Macro recorded 8/31/2003 by Shannon Greene
'
  Dim doapp As Boolean
  
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
      appWait
    End If
    
    With Sheets("Attacks")
      .Columns("C:O").EntireColumn.Hidden = True
      .Columns("R:AD").EntireColumn.Hidden = True
      .Columns("AG:AS").EntireColumn.Hidden = True
      .Columns("AV:BH").EntireColumn.Hidden = True
      .Columns("BK:BW").EntireColumn.Hidden = True
      .Columns("BZ:CL").EntireColumn.Hidden = True
      .Rows("5:13").EntireRow.Hidden = True
      .Rows("56:65").EntireRow.Hidden = True
'      .Range("A1").Select
    End With
    
    If doapp Then
      appDefault
    End If
    
End Sub
Sub ShowAttackInfo()
'
' HideAttackInfo Macro
' Macro recorded 8/31/2003 by Shannon Greene
'
  Dim doapp As Boolean
  
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
      appWait
    End If
    
    With Sheets("Attacks")
      .Columns("C:O").EntireColumn.Hidden = False
      .Columns("R:AD").EntireColumn.Hidden = False
      .Columns("AG:AS").EntireColumn.Hidden = False
      .Columns("AV:BH").EntireColumn.Hidden = False
      .Columns("BK:BW").EntireColumn.Hidden = False
      .Columns("BZ:CL").EntireColumn.Hidden = False
      .Rows("5:13").EntireRow.Hidden = False
      .Rows("56:65").EntireRow.Hidden = False
'      .Range("A1").Select
    End With

    If doapp Then
      appDefault
    End If

End Sub

Sub adjustUsage(special As Range, weaponType As Range, usage As Range)
    Select Case Right(special.Value, 1)
        Case "P"
            usage.Value = 8
        Case "S"
            usage.Value = 9
        Case "T"
            usage.Value = 3
        Case "O"
            usage.Value = 1
        Case Else
            Select Case weaponType.Value
                Case "L", "O", "U"
                    usage.Value = 1
                Case "T", "R"
                    usage.Value = 2
            End Select
    End Select
End Sub
Sub DropDown88_Change()
    adjustUsage Range("o7"), Range("d8"), Range("AttackUsage1")
End Sub
Sub DropDown234_Change()
    adjustUsage Range("ad7"), Range("s8"), Range("AttackUsage2")
End Sub
Sub DropDown235_Change()
    adjustUsage Range("as7"), Range("ah8"), Range("AttackUsage3")
End Sub
Sub DropDown236_Change()
    adjustUsage Range("bh7"), Range("aw8"), Range("AttackUsage4")
End Sub
Sub DropDown237_Change()
    adjustUsage Range("bw7"), Range("bl8"), Range("AttackUsage5")
End Sub
Sub DropDown238_Change()
    adjustUsage Range("cl7"), Range("ca8"), Range("AttackUsage6")
End Sub
