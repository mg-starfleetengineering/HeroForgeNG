Attribute VB_Name = "DescriptionSortingRoutines"
Option Explicit

Sub ADescrFeatReverse()

    On Error Resume Next

    Dim r As Range
    Dim n As Integer

    Set r = Range("D11:D3321")
    For n = 1 To r.Rows.count
        r.Cells(n, 1).Select
        Selection.Validation.InputMessage = Right(r.Cells(n, 3), Len(r.Cells(n, 3)) - 3)
    Next n

End Sub

Sub ADescrFeat()
    On Error Resume Next
    
    Dim r As Range
    Dim n As Integer
    
    Set r = Range("D11:D3321")
    For n = 1 To r.Rows.count
        r.Cells(n, 1).Select
        If Selection.Validation.InputMessage <> "" Then
            r.Cells(n, 3) = " : " & Selection.Validation.InputMessage
        End If
    Next n
End Sub

Sub ADescrSkillsTricks()
    On Error Resume Next
    
    Dim r As Range
    Dim n As Integer
    
    Set r = Range("C6:C53")
    For n = 1 To r.Rows.count
        r.Cells(n, 1).Select
        If Selection.Validation.InputMessage <> "" Then
            r.Cells(n, 3) = " : " & Selection.Validation.InputMessage
        End If
    Next n
End Sub

Sub ADescrManeuvers()
    On Error Resume Next
    
    Dim r As Range
    Dim n As Integer
    
    Set r = Range("C4:C227")
    For n = 1 To r.Rows.count
        r.Cells(n, 1).Select
        If Selection.Validation.InputMessage <> "" Then
            r.Cells(n, 18) = " : " & Selection.Validation.InputMessage
        End If
    Next n
End Sub

Sub ADescrTraits()
    On Error Resume Next
    
    Dim r As Range
    Dim n As Integer
    
    Set r = Range("C4:C49")
    For n = 1 To r.Rows.count
        r.Cells(n, 1).Select
        If Selection.Validation.InputMessage <> "" Then
            r.Cells(n, 10) = " : " & Selection.Validation.InputMessage
        End If
    Next n
End Sub

Sub ADescrFlaws()
    On Error Resume Next
    
    Dim r As Range
    Dim n As Integer
    
    Set r = Range("C5:C22")
    For n = 1 To r.Rows.count
        r.Cells(n, 1).Select
        If Selection.Validation.InputMessage <> "" Then
            r.Cells(n, 7) = " : " & Selection.Validation.InputMessage
        End If
    Next n
End Sub
