Attribute VB_Name = "Classes"
Option Explicit

Sub Class_DropDown_Change()
    Dim doapp As Boolean
    
    If Not (Range("ImportInProgress").Value Or Range("RedoInProgress").Value) Then
      If (Range("ClassesChanged").Value) Then
               
          doapp = (Application.Cursor <> xlWait)
          If doapp Then
              appWait
          End If
          
          Range("RedoInProgress").Value = True
          
          If (Range("CasterListChanged").Value) Then
              UpdateIndexCaster
          End If
          
          If (Range("ManifesterListChanged").Value) Then
              UpdateIndexManifester
          End If
          
          If (Range("MeldshaperListChanged").Value) Then
              UpdateIndexMeldshaper
          End If
          
          If (Range("IncarnumListChanged").Value) Then
              UpdateIndexIncarnum
              Range("IncarnumResetRange").Value = ""
          End If
          
          
          Range("ClassChksumOld").Value = Range("ClassChksum").Value
  
          
          AutomaticLanguages
          
          Sheets("Domain Select").Visible = Range("HasDomainChoices").Value
          Sheets("Prestige Classes I").Visible = Range("HasPrestige").Value
          Sheets("Prestige Classes II").Visible = Range("HasPrestige2").Value
          Sheets("Prestige Classes III").Visible = Range("HasPrestige3").Value
          Sheets("Maneuvers & Stances").Visible = Range("MartialClass").Value
          Sheets("Incarnum Abilities").Visible = Range("ShowIncarnum").Value
          Sheets("Soulmelds").Visible = Range("HasSoulmelds").Value
          Sheets("Marshal Auras").Visible = (Range("Mrslvl").Value >= 1)
          Sheets("Familiar").Visible = Range("HasFamiliar").Value
          Sheets("Animal Companion").Visible = (Range("CompanionChoiceLevel").Value >= 1)
          If Range("CompanionChoiceLevel").Value = 0 Then
            AnimalCompanion_Reset
          End If
          If Range("HasFamiliar").Value = 0 Then
            Range("FamiliarCell").Value = 1
          End If
          If Range("WildShapeCell").Value > Range("WildShapeListRowsCnt").Value + 1 Then
            Range("WildShapeCell").Value = 1
            Range("Wildshape").Value = False
          End If
          Sheets("Binder Vestiges").Visible = (Range("binlvl").Value >= 1)
          If Range("binlvl").Value = 0 Then
            BinderSelection_Reset
          End If
            
          
          Range("RedoInProgress").Value = False
          
          If doapp Then
              appDefault
          End If
          
      End If
    End If
            
End Sub
Sub AutomaticLanguages()
    'Dim currentSheet As Worksheet
    'Dim CutCopyMode As Boolean
    
    'Set currentSheet = ActiveSheet
    
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    'Sheets("Languages").Activate
    'Range("TblLanguagesHave").Select
    'Selection.Copy
    'Range("TblLanguagesSelected").Select
    'Selection.PasteSpecial Paste:=xlValues, Operation:=xlNone, SkipBlanks:= _
        True, Transpose:=False
    
    'Range("A5").Select
    'CutCopyMode = False
    'currentSheet.Activate
    
    Range("TblLanguagesSelected") = Range("TblLanguagesHave").Value
    
    If doapp Then
        appDefault
    End If

End Sub

Sub AddRisenMartyr()

Dim TemplateRow As Long

  If Range("RisenMartyr").Value Then
    TemplateRow = Range("TemplateSelectioncnt").Value + 1
    Range("TemplateSelection").Cells(TemplateRow, 1).Value = "Risen Martyr"
    Range("TemplateSelectionLvl").Cells(TemplateRow, 1).Value = Range("HitDice").Value - 1
  Else
    TemplateRow = 1 + Range("TemplateSelection").Find("Risen Martyr").Row - Range("TemplateSelection").Row
    Range("TemplateSelection").Cells(TemplateRow, 1).Value = vbNullString
    Range("TemplateSelectionLvl").Cells(TemplateRow, 1).Value = vbNullString
  End If

End Sub

Sub Familiar_DropDown_Change()
    Sheets("Familiar").Visible = Range("HasFamiliar").Value
End Sub

Sub LoremasterSecret()
    If Range("LorAbilMast").Value Then
        Range("LorAbilMasterLvl").Value = Range("LorLvl").Value
    Else
        Range("LorAbilMasterLvl").Value = 0
    End If
End Sub

Private Sub UpdateAnointedStatBump(RowIndex As Integer, classindex As Integer)
    Dim statSelect As Integer, loopcounter As Integer, classEntry As Integer, classLevel As Integer
    
    statSelect = Range("TblAnointedStatBumps").Cells(classindex, 1).Value
    
    If statSelect = 2 Then
        If classindex = 1 Then
            classEntry = _
                WorksheetFunction.Match("Anointed Knight", _
                    Range("TblClassList"), _
                    0)
        Else
            classEntry = _
                WorksheetFunction.Match("Warrior of Darkness", _
                    Range("TblClassList"), _
                    0)
        End If
        classLevel = 0
        For loopcounter = 1 To 60
            If Range("TblClassLvls").Cells(loopcounter, 1).Value = classEntry Then
                classLevel = classLevel + 1
            End If
            If classLevel = RowIndex Then
                Range("TblAnointedIntBumps").Cells(classindex, 1).Value = loopcounter
                Exit For
            End If
        Next loopcounter
    End If
End Sub
Sub UpdateAnointedStatBump1()
    Dim i As Integer
        
    If Range("AnointSelfStatBump").Value <> 2 Then
        Range("TblAnointedIntBumps").Cells(1, 1).Value = 0
        Exit Sub
    End If
    
    For i = 1 To 4
        If Range("TblAnointSelf").Cells(i, 1).Value = 5 Then
            Call UpdateAnointedStatBump(3 * i - 2, 1)
        End If
    Next i
End Sub

Sub UpdateAnointedStatBump2()
    Dim i As Integer
    
    If Range("BlackMagicElixirStatBump").Value <> 2 Then
        Range("TblAnointedIntBumps").Cells(3, 1).Value = 0
        Exit Sub
    End If
    
    For i = 1 To 3
        If Range("TblBlackMagicElixir").Cells(i, 1).Value = 4 Then
            Call UpdateAnointedStatBump(i * 3, 3)
        End If
    Next i
End Sub

Function FindClass(ClassName As String) As Boolean
  Dim c As Range
    
  For Each c In Range("TblChosenClasses")
    If c.Value = ClassName Then
      FindClass = True
        Exit Function
      End If
  Next c
  For Each c In Range("TblChosenGestaltClasses")
    If c.Value = ClassName Then
      FindClass = True
        Exit Function
      End If
  Next c
  FindClass = False
End Function

Sub SpecialistChange()
    Range("SpecForbid").Value = 1
    Range("SpecForbid2").Value = 1
    Range("SpecForbid3").Value = 1
    Range("SpecForbid4").Value = 1
End Sub

Sub GestaltSelect(Optional ShowGestalt As Variant)

Dim shp As Shape

    If IsMissing(ShowGestalt) Then
        ShowGestalt = Range("HRGestalt").Value
    End If

    With wsClasses
    
      On Error Resume Next
      If .Shapes("Gestalt_Classes") Is Nothing Then GroupGestalt
      On Error GoTo 0
      
      
      If ShowGestalt Then
        .Columns("D:E").Hidden = False
        .Shapes("Gestalt_Classes").Visible = msoTrue
        .Shapes("Gestalt_Classes").Left = 233
        .Shapes("Gestalt_Classes").Width = 181.5
      Else
        .Shapes("Gestalt_Classes").Visible = msoFalse
        .Columns("D:E").Hidden = True
      End If
      
    End With

    If Not ShowGestalt Then
        Range("TblGestaltClassLvls").Value = 1
    End If

End Sub

Sub QualifiedClasses()
    Dim str As String
    Dim ClassRowsCnt As Long, RowIndex As Long
    Dim ClassName(), ClassPreReq()
    
    With wsClassInfo.Range("TblClasses")
      ClassRowsCnt = .Rows.count
      ClassName = .Offset(0, Range("ClassInfoClassNameColumn").Value - 1).Resize(ClassRowsCnt, 1)
      ClassPreReq = .Offset(0, Range("ClassInfoClassPrereqColumn").Value - 1).Resize(ClassRowsCnt, 1)
    End With
    
    str = vbNullString
    
    For RowIndex = 1 To ClassRowsCnt
      If ClassPreReq(RowIndex, 1) Then
        str = str & vbCr & ClassName(RowIndex, 1)
      End If
    Next RowIndex
        
    str = "You might qualify for the following classes: " & vbCr & str
    str = "Please double check any class you wish to take." & vbCr & vbCr & str
    str = "Some PrC 's have Pre-req's that are not verified." & vbCr & vbCr & str
    
    MsgBox str, vbOKOnly, "Qualified Classes"
    
End Sub
