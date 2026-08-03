Attribute VB_Name = "wsRaceTemplates"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Worksheet_Change(ByVal Target As Range)
  Dim DoLycanthrope As Boolean, CellName As String

  DoLycanthrope = wsCreatureInfo.Range("IsLycanthrope").Value
  
  If Not Intersect(Target, Range("TemplateSelection")) Is Nothing Then
    If DoLycanthrope Then
      If wsClassInfo.Range("LycanthropeSelected").Value = 0 And LenB(Range("LycanthropeAnimal")) > 0 Then
        UpdateMonster Lycanthrope:=True
      End If
    Else
      If wsClassInfo.Range("LycanthropeSelected").Value > 0 Then
        UpdateMonster Lycanthrope:=True
      End If
    End If
  ElseIf Not Intersect(Target, Range("MCCell")) Is Nothing Then
    UpdateMonster
  ElseIf Not Intersect(Target, Range("LycanthropeAnimal")) Is Nothing Then
    If DoLycanthrope Then
      UpdateMonster Lycanthrope:=True
    End If
  Else

  End If
  
  If Not Intersect(Target, Range("RaceTxt")) Is Nothing Then
    RaceChange
  End If
  
  If Not Intersect(Target, Range("RaceOptions")) Is Nothing Then
    wsInterfaces.EnableCalculation = False
    wsInterfaces.EnableCalculation = True
    wsInterfaces.Calculate
    If Range("RaceTxt").Value = "Dragonborn of Bahamut [RotD]" And Not Intersect(Target, Range("DragonbornFormerRaceTxt")) Is Nothing Then
      RaceChange
    End If
  End If
  
End Sub
