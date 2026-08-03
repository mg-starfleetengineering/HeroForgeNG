Attribute VB_Name = "DRCalc"
Option Explicit

Public Function GetDRValue(DRText As String, DRType As String) As Long

Dim DRArray() As String
Dim LoopCnt As Long, DRValue As Long

  GetDRValue = 0
  If InStr(DRText, DRType) > 0 Then
    If InStr(DRText, ",") > 0 Then
      DRArray = Split(DRText, ", ")
    Else
      ReDim DRArray(0)
      DRArray(0) = DRText
    End If
    For LoopCnt = 0 To UBound(DRArray)
      If Mid(DRArray(LoopCnt), InStr(DRArray(LoopCnt), "/") + 1, 255) = DRType Then
        DRValue = Left(DRArray(LoopCnt), InStr(DRArray(LoopCnt), "/") - 1)
        If DRValue > GetDRValue Then
          GetDRValue = DRValue
        End If
      End If
    Next LoopCnt
  End If
  
End Function

Public Function GetDRCombo(DRText As String, DRComboType As String) As String

Dim DRArray() As String
Dim LoopCnt As Long

  DRComboType = " " & DRComboType & " "
  GetDRCombo = DRComboType
  If InStr(DRText, DRComboType) > 0 Then
    If InStr(DRText, ",") > 0 Then
      DRArray = Split(DRText, ", ")
    Else
      ReDim DRArray(1)
      DRArray(0) = DRText
    End If
    For LoopCnt = 0 To UBound(DRArray)
      If InStr(DRArray(LoopCnt), DRComboType) > 0 Then
        If DRComboType <> " or " Or InStr(DRArray(LoopCnt), " and ") = 0 Then
          GetDRCombo = Mid(DRArray(LoopCnt), InStr(DRArray(LoopCnt), "/") + 1, 255)
        End If
      End If
    Next LoopCnt
  End If
  
End Function

Public Function GetDRAbilityType(DRText As String) As String

Dim DRArray() As String
Dim LoopCnt As Long

  If DRText = " or " Or DRText = " and " Then
    GetDRAbilityType = "Ex or Su"
  Else
    GetDRAbilityType = "Ex"
  
    DRText = Replace(DRText, " and ", ",")
    DRText = Replace(DRText, " or ", ",")
    
    DRArray = Split(DRText, ",")
    For LoopCnt = 0 To UBound(DRArray)
      If Range("TblDR").Find(what:=DRArray(LoopCnt), lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 2).Value = "Su" Then
        GetDRAbilityType = "Su"
      End If
    Next LoopCnt
  End If

End Function
