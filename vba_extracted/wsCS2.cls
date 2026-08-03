Attribute VB_Name = "wsCS2"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Option Explicit

Sub ProcTemp_DEL()
    Dim i As Integer
    Dim count As Integer
    Dim abilities As String
    
    count = 0
    ' Sheets("Character Sheet II").Range("cy3").Value = 0
    Sheets("Character Sheet II").Range("cZ4").Value = 0
    abilities = Range("TblAbilities").Value
    If Len(abilities) = 0 Then
        Exit Sub
    End If
    
    For i = 1 To Len(abilities)
        If Mid(abilities, i, 1) = Chr(10) Then
            count = count + 1
            If count = 70 Then
                Do
                    i = i - 1
                Loop Until Mid(abilities, i, 1) = "•" Or (Mid(abilities, i, 2) = Chr(10) & Chr(150))
                ' Sheets("Character Sheet II").Range("cy3").Value = i - 1
                Sheets("Character Sheet II").Range("cz4").Value = i - 1
                
                'If Mid(abilities, i, 1) = "•" Then
                    'Do
                        'i = i - 1
                    'Loop Until Mid(abilities, i, 2) = Chr(10) & Chr(150)
                    'Sheets("Character Sheet II").Range("cz3").Value = i + 1
                    'Sheets("Character Sheet II").Range("da3").Value = InStr(i + 1, abilities, Chr(10), vbTextCompare) - i
                'Else
                    'Sheets("Character Sheet II").Range("cz3").Value = 0
                'End If
                Exit For
            End If
        End If
    Next i
End Sub

Private Sub Worksheet_Activate()
    
Dim doapp As Boolean

  doapp = (Application.Cursor <> xlWait)
  If doapp Then
    appWait
  End If
  
  WordWrapAbilities "CSIIAbilities", "CSIIIAbilities"
  
  If doapp Then
    appDefault
  End If
  
End Sub
