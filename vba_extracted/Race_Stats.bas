Attribute VB_Name = "Race_Stats"
Option Explicit

Public blnCancelled As Boolean
Public check1 As Boolean, check2 As Boolean, check3 As Boolean, check4 As Boolean
Public check5 As Boolean, check6 As Boolean, check7 As Boolean, check8 As Boolean
Public option1 As Boolean, option2 As Boolean, option3 As Boolean

Sub RandomAssign()
    Range("TblRandomDest").Value = Range("TblRandomSource").Value
End Sub
Sub Contract_1to4()
    With Range("H3:H8").Interior
        .ColorIndex = xlNone
    End With
    Columns("E:G").ColumnWidth = 0
End Sub
Sub Expand_1to4()
    With Range("H3:H8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("E:G").ColumnWidth = 2
End Sub
Sub Contract_5to8()
    With Range("L3:L8").Interior
        .ColorIndex = xlNone
    End With
    Columns("I:K").ColumnWidth = 0
End Sub
Sub Expand_5to8()
    With Range("L3:L8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("I:K").ColumnWidth = 2
End Sub
Sub Contract_9to12()
    With Range("P3:P8").Interior
        .ColorIndex = xlNone
    End With
    Columns("M:O").ColumnWidth = 0
End Sub
Sub Expand_9to12()
    With Range("P3:P8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("M:O").ColumnWidth = 2
End Sub
Sub Contract_13to16()
    With Range("T3:T8").Interior
        .ColorIndex = xlNone
    End With
    Columns("Q:S").ColumnWidth = 0
End Sub
Sub Expand_13to16()
    With Range("T3:T8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("Q:S").ColumnWidth = 2
End Sub
Sub Contract_17to20()
    With Range("X3:X8").Interior
        .ColorIndex = xlNone
    End With
    Columns("U:W").ColumnWidth = 0
End Sub
Sub Expand_17to20()
    With Range("X3:X8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("U:W").ColumnWidth = 2
End Sub
Sub Contract_21to24()
    With Range("AB3:AB8").Interior
        .ColorIndex = xlNone
    End With
    Columns("Y:AA").ColumnWidth = 0
End Sub
Sub Expand_21to24()
    With Range("AB3:AB8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("Y:AA").ColumnWidth = 2
End Sub
Sub Contract_25to28()
    With Range("AF3:AF8").Interior
        .ColorIndex = xlNone
    End With
    Columns("AC:AE").ColumnWidth = 0
End Sub
Sub Expand_25to28()
    With Range("AF3:AF8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("AC:AE").ColumnWidth = 2
End Sub
Sub Contract_29to32()
    With Range("AJ3:AJ8").Interior
        .ColorIndex = xlNone
    End With
    Columns("AG:AI").ColumnWidth = 0
End Sub
Sub Expand_29to32()
    With Range("AJ3:AJ8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("AG:AI").ColumnWidth = 2
End Sub
Sub Contract_33to36()
    With Range("AN3:AN8").Interior
        .ColorIndex = xlNone
    End With
    Columns("AK:AM").ColumnWidth = 0
End Sub
Sub Expand_33to36()
    With Range("AN3:AN8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("AK:AM").ColumnWidth = 2
End Sub
Sub Contract_37to40()
    With Range("AR3:AR8").Interior
        .ColorIndex = xlNone
    End With
    Columns("AO:AQ").ColumnWidth = 0
End Sub
Sub Expand_37to40()
    With Range("AR3:AR8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("AO:AQ").ColumnWidth = 2
End Sub
Sub Contract_41to44()
    With Range("AV3:AV8").Interior
        .ColorIndex = xlNone
    End With
    Columns("AS:AU").ColumnWidth = 0
End Sub
Sub Expand_41to44()
    With Range("AV3:AV8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("AS:AU").ColumnWidth = 2
End Sub
Sub Contract_45to48()
    With Range("AZ3:AZ8").Interior
        .ColorIndex = xlNone
    End With
    Columns("AW:AY").ColumnWidth = 0
End Sub
Sub Expand_45to48()
    With Range("AZ3:AZ8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("AW:AY").ColumnWidth = 2
End Sub
Sub Contract_49to52()
    With Range("BD3:BD8").Interior
        .ColorIndex = xlNone
    End With
    Columns("BA:BC").ColumnWidth = 0
End Sub
Sub Expand_49to52()
    With Range("BD3:BD8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("BA:BC").ColumnWidth = 2
End Sub
Sub Contract_53to56()
    With Range("BH3:BH8").Interior
        .ColorIndex = xlNone
    End With
    Columns("BE:BG").ColumnWidth = 0
End Sub
Sub Expand_53to56()
    With Range("BH3:BH8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("BE:BG").ColumnWidth = 2
End Sub
Sub Contract_57to60()
    With Range("BL3:BL8").Interior
        .ColorIndex = xlNone
    End With
    Columns("BI:BK").ColumnWidth = 0
End Sub
Sub Expand_57to60()
    With Range("BL3:BL8").Interior
        .ColorIndex = 6
        .Pattern = xlSolid
    End With
    Columns("BI:BK").ColumnWidth = 2
End Sub

Sub UpdateMonster(Optional Lycanthrope As Boolean)

  Dim HDCount As Long, AddedHD As Long, OldHD As Long
  Dim MonsterIdx As Long, RowIndex As Long, rowBase As Long
  Dim doapp As Boolean, IsGestalt As Boolean
  Dim Classes(), GClasses()
    
    If IsMissing(Lycanthrope) Then
        Lycanthrope = True
    End If
  
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
      
    IsGestalt = Range("HRGestalt").Value
    
    If Lycanthrope Then
      OldHD = Range("TemplateHDMirror").Value
      HDCount = Range("LycanthropeSelected").Value  'Count of LycanthropeCell in TblClassLvls
      MonsterIdx = Range("LycanthropeCell").Value
      AddedHD = Range("TemplateAddedHD").Value
      rowBase = 2
    Else
      OldHD = Range("RaceHDMirror").Value
      HDCount = Range("MonSelected").Value  'Count of MonCell in TblClassLvls
      MonsterIdx = Range("MonCell").Value
      AddedHD = Range("RaceHD").Value
      rowBase = 1
    End If
    
    If AddedHD <> HDCount Then
    
      Range("RedoInProgress").Value = True
      Classes() = Range("TblClassLvls").Resize(60, 1).Value
'      If IsGestalt Then
'        GClasses() = Range("TblGestaltClassLvls").Resize(20, 1).Value
'      End If
    
      If AddedHD > HDCount Then
           
        RowIndex = rowBase
        Do Until (RowIndex = 61 Or HDCount = AddedHD)
            If Classes(RowIndex, 1) = 1 Then
                Classes(RowIndex, 1) = MonsterIdx
'                If IsGestalt Then
'                    If GClasses(RowIndex, 1) = 1 Then
'                        GClasses(RowIndex, 1) = MonsterIdx
'                    End If
'                End If
                HDCount = HDCount + 1
            End If
            RowIndex = RowIndex + 1
        Loop
      
      Else
      
        RowIndex = rowBase
        HDCount = 0
        Do Until (RowIndex = 61 - OldHD + AddedHD)
            If Classes(RowIndex, 1) = MonsterIdx Then
                HDCount = HDCount + 1
            End If
            If HDCount > AddedHD Then
                Classes(RowIndex, 1) = Classes(RowIndex + OldHD - AddedHD, 1)
            End If
'                If IsGestalt Then
'                    If GClasses(RowIndex, 1) = MonsterIdx Then
'                        GClasses(RowIndex, 1) = 1
'                    End If
'                End If
            RowIndex = RowIndex + 1
        Loop
        Do Until RowIndex = 61
            Classes(RowIndex, 1) = 1
            RowIndex = RowIndex + 1
        Loop
        
      End If
      
      Range("TblClassLvls").Resize(60, 1).Value = Classes()
'      If IsGestalt Then
'        Range("TblGestaltClassLvls").Resize(60, 1).Value = GClasses()
'      End If

      If Lycanthrope Then
        Range("TemplateHDMirror").Value = AddedHD
      Else
        Range("RaceHDMirror").Value = AddedHD
      End If
          
      Range("RedoInProgress").Value = False
      Application.Calculate
      Class_DropDown_Change
          
    End If
      
    If doapp Then
        appDefault
    End If
      
End Sub

Sub RaceChange()

    Dim doapp As Boolean
       
    Languages_Reset Partial:=True
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    If Range("ImportAttack").Value = False Then
        Range("AttackSize1").Value = Range("SizeNumber").Value
        Range("AttackSize2").Value = Range("SizeNumber").Value
        Range("AttackSize3").Value = Range("SizeNumber").Value
        Range("AttackSize4").Value = Range("SizeNumber").Value
        Range("AttackSize5").Value = Range("SizeNumber").Value
        Range("AttackSize6").Value = Range("SizeNumber").Value
    End If
    
    Call UpdateMonster
          
    randomAgeHgtWgt
    
    If Sheets("Incarnum Abilities").Range("IncarnumListChanged").Value Then
        UpdateIndexIncarnum
        Sheets("Incarnum Abilities").Range("IncarnumResetRange").Value = ""
    End If
    Sheets("Incarnum Abilities").Visible = Sheets("Incarnum Abilities").Range("ShowIncarnum").Value
    
    
    ' Turn on automatic calculation for the duration of updating the race stats to prevent
    ' crash on MACs
'    Application.Calculation = xlAutomatic

    ' Put calcualtion mode back to manual (we may be getting called from another routine that
    ' does not want automatic calculation to be on
'    Application.Calculation = xlManual
    
    If doapp Then
        appDefault
    End If
End Sub

Function rollDice(numDice As Integer, dieType As Integer) As Integer

    Dim newVal As Integer
    Dim loopcounter As Integer
    
    Randomize
    rollDice = 0
    
    For loopcounter = 1 To numDice
        newVal = Int(dieType * Rnd + 1)
        rollDice = rollDice + newVal
    Next loopcounter
    
End Function

Sub randomAgeHgtWgt()

    Dim ageMod As Integer, hgtMod As Integer, wgtMod As Integer
    
    If Range("HasAgeInfo").Value Then
      ageMod = rollDice(Range("ageNumDice").Value, Range("ageDieType").Value)
      Range("RandomAge").Value = Range("baseAge").Value + ageMod
    Else
        Range("RandomAge").Value = 0
    End If
    
    If Range("HasHeightWeightInfo").Value Then
      hgtMod = rollDice(Range("hgtNumDice").Value, Range("hgtDieType").Value)
      Range("RandomHeight").Value = Range("baseHgt").Value + hgtMod
      wgtMod = hgtMod * rollDice(Range("wgtNumDice").Value, Range("wgtDieType").Value)
      Range("RandomWeight").Value = Range("baseWgt").Value + wgtMod
    Else
        Range("RandomHeight").Value = 0
        Range("RandomWeight").Value = 0
    End If
    
End Sub

