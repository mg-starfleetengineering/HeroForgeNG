Attribute VB_Name = "frmTemplateInfo"
Attribute VB_Base = "0{ACB9A61D-B0C3-4929-80E7-E929942CA6C2}{B7FC7896-11B4-4603-82FD-1254B4A69A2D}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Private Sub cbxTemplateInfo_Change()

Dim idx As Long
Dim srcacronym As String, srctitle As String, srcalt As String, srctext
Dim prereqtext As String, descriptiontext As String
Dim availabletext As String, availcomment As String

  idx = cbxTemplateInfo.ListIndex + 1
  If idx > 1 Then
    srcacronym = Range("TblTemplateInfo").Cells(idx, 51).Value
    srctitle = Range("TblSourcebooks").Find(srcacronym, LookIn:=xlValues, _
      lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 1).Value
    srcalt = Range("TblTemplateInfo").Cells(idx, 53).Value
    If LenB(srcalt) > 0 Then
      srcalt = ") (also in " & srcalt & ")"
    Else
      srcalt = ")"
    End If
    
    srctext = srctitle & " (p." & _
      Range("TblTemplateInfo").Cells(idx, 52) & srcalt
    prereqtext = Range("TblTemplateInfo").Cells(idx, 46).Value
    descriptiontext = Range("TblTemplateInfo").Cells(idx, 2).Value
    If Range("TblTemplateInfo").Cells(idx, 56).Value Then
      availabletext = "YES"
      availcomment = vbNullString
    Else
      availabletext = "NO"
      availcomment = "A template might be unavailable either because the sourcebook has not been selected, or because some prerequisites are not met."
    End If
      
  Else
    srctext = vbNullString
    prereqtxt = vbNullString
    descriptiontext = vbNullString
    availabletext = vbNullString
    availcomment = vbNullString
  End If
    
  lblTemplateSrc.Caption = srctext
  lblTemplatePrereqs.Caption = prereqtext
  lblTemplateDescription.Caption = descriptiontext
  lblTemplateAvailable.Caption = availabletext
  lblavailcomment.Caption = availcomment
  
End Sub

Private Sub lblTemplateAvailable_Click()

End Sub
