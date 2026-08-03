Attribute VB_Name = "DevUtils"
'Option Explicit
'Private Declare Function GetTickCount Lib "kernel32" () As Long

Sub ShowEverything()
    Dim ws As Worksheet
    Dim rngTblSheets As Range, i As Integer
    Dim shtDev As Boolean, doapp As Boolean
    Dim shtLastColumn As Integer, shtLastRow As Integer, shtIndex As Integer
    Dim shtDefaultCell As String
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
      appWait
    End If
    
    Set rngTblSheets = Range("tblSheets")
    
    For Each ws In ThisWorkbook.Worksheets
        With ws
            i = rngTblSheets.Find(.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 2).Value + 1
            shtIndex = rngTblSheets.Cells(i, 3).Value
            shtDev = rngTblSheets.Cells(i, 7).Value
            shtLastColumn = rngTblSheets.Cells(i, 9).Value
            shtLastRow = rngTblSheets.Cells(i, 10).Value
            shtDefaultCell = rngTblSheets.Cells(i, 11).Value
            
            .Activate
            .Unprotect
            
            ActiveWindow.DisplayHeadings = True
            
            If shtDev Then
                .Visible = xlSheetVisible
            Else
                .Visible = xlSheetHidden
            End If
                       
            If .Index <> shtIndex Then
                .Move before:=Worksheets(shtIndex)
            End If
                       
            If shtLastColumn > 0 Then
                Range(Columns(shtLastColumn + 1), Columns(16384)).EntireColumn.Hidden = False
            End If
            
            If shtLastRow > 0 Then
                Range(shtLastRow + 1 & ":65536").EntireRow.Hidden = False
            End If
            
            If .Visible = xlSheetVisible Then
              .Range("A1").Select
              If LenB(shtDefaultCell) > 0 Then .Range(shtDefaultCell).Select
  '            SendKeys ("^{HOME}")
            End If
        End With
    Next ws
    
    Set rngTblSheets = Nothing
    
    ShowAttackInfo
    GestaltSelect (True)
    
    If doapp Then
      appDefault
    End If
    
    wsOptions.Activate
End Sub

Sub ShowDefault()
    Dim ws As Worksheet
    Dim rngTblSheets As Range, i As Integer
    Dim shtName As String, shtIndex As Integer, shtDefault As Boolean, shtProtected As Boolean
    Dim doapp As Boolean
    Dim shtLastColumn As Integer, shtLastRow As Integer, shtDefaultCell As String

    doapp = (Application.Cursor <> xlWait)
    If doapp Then
      appWait
    End If

    Set rngTblSheets = Range("tblSheets")
    
    For Each ws In ThisWorkbook.Worksheets
        With ws
            Application.StatusBar = "Handling sheet " & .Name
            i = rngTblSheets.Find(.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 2).Value + 1
            shtName = rngTblSheets.Cells(i, 2).Value
            shtIndex = rngTblSheets.Cells(i, 3).Value
            shtDefault = rngTblSheets.Cells(i, 4).Value
            shtProtected = rngTblSheets.Cells(i, 8).Value
            shtLastColumn = rngTblSheets.Cells(i, 9).Value
            shtLastRow = rngTblSheets.Cells(i, 10).Value
            shtDefaultCell = rngTblSheets.Cells(i, 11).Value
            
            .Activate
            .Unprotect
                                   
            If shtLastColumn > 0 Then
                Range(Columns(shtLastColumn + 1), Columns(1024)).EntireColumn.Hidden = True
            End If
            
            If shtLastRow > 0 Then
                Range(shtLastRow + 1 & ":65536").EntireRow.Hidden = True
            End If
            
            If .Index <> shtIndex Then
                .Move before:=Worksheets(shtIndex)
            End If
            
            If .Name <> shtName Then
                .Name = shtName
            End If
            
            If shtProtected Then
                .Protect
            End If
            
            Range("A1").Select
            If LenB(shtDefaultCell) > 0 Then .Range(shtDefaultCell).Select
' This would be nice to have, but doesn't seem to work...
            SendKeys ("^{HOME}")
            
            If shtDefault Then
                ActiveWindow.DisplayHeadings = False
                .Visible = xlSheetVisible
            Else
                .Visible = xlSheetHidden
            End If
        End With
    Next ws
    
    Set rngTblSheets = Nothing
    
    GestaltSelect
    HideAttackInfo
    
    If doapp Then
      appDefault
    End If
    Application.StatusBar = ""
    wsOptions.Activate
End Sub

Sub GroupGestalt()
Dim ControlList As String, MyArray() As String
Dim temp As Variant, shpName() As Variant
Dim shpCount As Integer
Dim shp As Shape
For Each shp In wsClasses.Shapes()
    With shp
          If Left(.Name, 9) = "lstGClass" Then
            .Left = 233
            .Width = 181.5
            ControlList = ControlList & "," & .Name
          End If
    End With
Next shp
'strip the leading separator.
ControlList = Right(ControlList, Len(ControlList) - 1)
'have to do some gym to set the name list. The double assignment is necessary to get the type right (otherwise it breaks in excel2003)
temp = Split(ControlList, ",")
ReDim MyArray(UBound(temp))
ReDim shpName(UBound(temp))
For shpCount = LBound(temp) To UBound(temp)
    MyArray(shpCount) = temp(shpCount)
    shpName(shpCount) = MyArray(shpCount)
Next shpCount
'now build the group
wsClasses.Shapes.Range(shpName).Group.Name = "Gestalt_Classes"
End Sub


Sub cleartempl()

Dim mycomment As Comment
Dim MyArray() As String
Dim i As Long
Dim str As String, skill As String

For Each mycomment In wsCustomRace.Comments
  With mycomment
    .Shape.Left = 250
    .Shape.Width = 150
  
  End With
Next mycomment

End Sub

'Sub PerformanceTest()
'    Dim lngStart As Long
'    Dim lngDuration As Long
'
'    lngStart = GetTickCount
'
'    ' Procedure to test here
'    wsClasses.Range("c2:c10").Value = 1
'
'    lngDuration = GetTickCount - lngStart
'
'    Debug.Print lngDuration
'End Sub
