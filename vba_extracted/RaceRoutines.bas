Attribute VB_Name = "RaceRoutines"
Option Explicit

Sub ShowTemplateInfo()
  frmTemplateInfo.Show
End Sub

Function GetRacialSkill(SkillText As String, SkillName As String) As Long
  Dim SkillArray() As String, SkillAny As String, SkillBase As String
  Dim LoopCnt As Long, SkillValue As Long

  GetRacialSkill = 1
  If InStr(SkillName, "(") > 0 Then
    SkillAny = Left(SkillName, InStr(SkillName, "(") - 2) & " (any)"
  End If
  If InStr(SkillText, SkillName) > 0 Then
    GetRacialSkill = 2
  Else
    If LenB(SkillAny) > 0 Then
      If InStr(SkillText, SkillAny) > 0 Then
        GetRacialSkill = 2
      End If
    End If
  End If

End Function

Public Function GetSkillMod(SkillText As String, SkillName As String) As Long
  Dim SkillArray() As String, SkillAny As String, SkillBase As String
  Dim LoopCnt As Long, SkillValue As Long, NextPlus As Long
  Dim SkillPen As Boolean

  GetSkillMod = 0
  SkillPen = False
  
  If LenB(SkillName) = 0 Or LenB(SkillText) = 0 Then GoTo Exit_Function
  
  If InStr(SkillName, "(") > 0 Then
    SkillAny = Left(SkillName, InStr(SkillName, "(") - 2) & " (any)"
  End If
  
  If InStr(SkillText, SkillName) > 0 Then
    If InStr(SkillText, ",") > 0 Then
      SkillArray = Split(SkillText, ",")
    Else
      ReDim SkillArray(0)
      SkillArray(0) = SkillText
    End If
    For LoopCnt = 0 To UBound(SkillArray)
      NextPlus = InStr(SkillArray(LoopCnt), "+")
      If NextPlus = 0 And InStr(SkillArray(LoopCnt), "-") > 0 Then
        NextPlus = InStr(SkillArray(LoopCnt), "-")
        SkillPen = True
      End If
      If NextPlus > 0 Then
        If InStr(SkillArray(LoopCnt), ":") > 0 Then
            SkillBase = Left(SkillArray(LoopCnt), InStr(SkillArray(LoopCnt), ":") - 1)
        Else
            SkillBase = Left(SkillArray(LoopCnt), NextPlus - 1)
        End If
        If (SkillBase = SkillName) Or (SkillBase = SkillAny) Then
          SkillValue = Mid(SkillArray(LoopCnt), NextPlus + IIf(SkillPen, 0, 1))
          If SkillValue > GetSkillMod Then
            GetSkillMod = SkillValue
          ElseIf SkillValue < 0 Then
            GetSkillMod = SkillValue + GetSkillMod
          End If
        End If
      End If
    Next LoopCnt
  End If
  
Exit_Function:
End Function

Public Function GetSkillRanks(SkillText As String, SkillName As String) As Long
  Dim SkillArray() As String, SkillAny As String, SkillBase As String
  Dim LoopCnt As Long, SkillValue As Long, NextPlus As Long, NextColon As Long

  GetSkillRanks = 0
  
  If LenB(SkillName) = 0 Or LenB(SkillText) = 0 Then GoTo Exit_Function
  
  If InStr(SkillName, "(") > 0 Then
    SkillAny = Left(SkillName, InStr(SkillName, "(") - 2) & " (any)"
  End If
  
  If InStr(SkillText, SkillName) > 0 Then
    If InStr(SkillText, ",") > 0 Then
      SkillArray = Split(SkillText, ",")
    Else
      ReDim SkillArray(0)
      SkillArray(0) = SkillText
    End If
    For LoopCnt = 0 To UBound(SkillArray)
      NextColon = InStr(SkillArray(LoopCnt), ":")
      NextPlus = InStr(SkillArray(LoopCnt), "+")
      If NextPlus = 0 And InStr(SkillArray(LoopCnt), "-") > 0 Then
        NextPlus = InStr(SkillArray(LoopCnt), "-")
      End If
      If NextColon > 0 Then
        SkillBase = Left(SkillArray(LoopCnt), NextColon - 1)
        If (SkillBase = SkillName) Or (SkillBase = SkillAny) Then
          SkillValue = Mid(SkillArray(LoopCnt), NextColon + 1, IIf(NextPlus > 0, NextPlus - NextColon, Len(SkillArray(LoopCnt))))
          If SkillValue > GetSkillRanks Then
            GetSkillRanks = SkillValue
          End If
        End If
      End If
    Next LoopCnt
  End If
  
Exit_Function:
End Function

Function GetCreatureSpecial(CreatureSpecialTxt, Tag) As String
  Dim StartPos As Long, NextPos As Long

  StartPos = InStr(CreatureSpecialTxt, Tag)
  If StartPos > 0 Then
    NextPos = InStr(StartPos, CreatureSpecialTxt, ";")
    GetCreatureSpecial = Mid(CreatureSpecialTxt, StartPos + Len(Tag) + 1, NextPos - StartPos - Len(Tag) - 1)
  Else
    GetCreatureSpecial = vbNullString
  End If
  
End Function

