Attribute VB_Name = "StringFunctions"
Option Explicit

Function RangeConcat(ByVal delim As String, ByVal dotrim As Boolean, ParamArray arr()) As String
Attribute RangeConcat.VB_Description = "RANGECONCAT(delimiter, trim as Boolean, range)"
Attribute RangeConcat.VB_ProcData.VB_Invoke_Func = " \n14"

  Dim rng As Range, x As Variant, y As Variant

  For Each x In arr
    If TypeOf x Is Range Then
      For Each rng In x.Cells
        If LenB(rng.Value) > 0 Then
          RangeConcat = RangeConcat & rng.Value & delim
        End If
      Next rng
    ElseIf IsArray(x) Then
      For Each y In x
        If LenB(y) > 0 Then
          RangeConcat = RangeConcat & IIf(IsArray(y), RangeConcat(delim, False, y), y) & delim
        End If
      Next y
    Else
      If LenB(x) > 0 Then
        RangeConcat = RangeConcat & x & delim
      End If
    End If
  Next x
  
'Strip trailing delimiter if requested
  If Len(RangeConcat) = 0 Then
    RangeConcat = ""
  Else
    If dotrim Then
      RangeConcat = Left(RangeConcat, Len(RangeConcat) - Len(delim))
    End If
  End If

End Function


Function ConcatIf(ByVal Compare_Range As Range, _
    Optional ByVal Criteria As Variant, _
    Optional ByVal Concat_Range As Range, _
    Optional ByVal Delimiter As String, _
    Optional ByVal dotrim As Boolean = False) As String
        
    If IsMissing(Delimiter) Then
        Delimiter = ""
    End If

    Dim i As Long, j As Long
    Dim doCompare As Boolean, doConcat As Boolean
    
    If Compare_Range Is Nothing Then Exit Function
    If Concat_Range Is Nothing Then Set Concat_Range = Compare_Range
    
    doCompare = Not (IsMissing(Criteria))
    If doCompare Then
        If IsObject(Criteria) Then
            Criteria = CStr(Criteria.Value)
        End If
    End If
    
    With Concat_Range
        For j = 1 To .Columns.count
            For i = 1 To .Rows.count
                If .Cells(i, j) <> "" Then
                    doConcat = True
                    If doCompare Then
                        doConcat = (Application.CountIf(Compare_Range.Cells(i, j), Criteria) = 1)
                    End If
                    If doConcat Then
                        ConcatIf = ConcatIf & CStr(.Cells(i, j)) & Delimiter
                    End If
                End If
            Next i
        Next j
    End With
            
    If dotrim And Len(Delimiter) > 0 And Len(ConcatIf) > 0 Then
      ConcatIf = Left(ConcatIf, Len(ConcatIf) - Len(Delimiter))
    End If
       
End Function

Public Function MultiSearch(ByRef SearchedList As String, ByRef SoughtList As String, _
  Optional ByRef ListDelimiter As Variant) As Boolean
' Returns TRUE if any element in SoughtList matches an element in SearchedList.
' The comparison is case-insensitive (arguments are converted to lower case for the check).
' Items in Soughtlist are encapsulated with the delimiter to ensure full matches only.
' Returns FALSE if there is no match or if an argument is in error.
' This function is commutative, but will work faster if both lists are sorted alphabetically
' and the largest set passed as SearchedList.

Dim SoughtArray() As String, strSearched As String, Delimiter As String
Dim i As Long

  MultiSearch = False
  
'Identify delimiter. Use "," by default.
  If IsMissing(ListDelimiter) Then
    Delimiter = ","
  Else
    Delimiter = CStr(ListDelimiter)
  End If
  
'Encapsulate list to get exact matches only
  If IsError(SearchedList) Then
    Exit Function
  Else
    strSearched = Delimiter & LCase(SearchedList) & Delimiter
  End If
'Break down items that will be sought
  If IsError(SoughtList) Then
    Exit Function
  Else
    SoughtArray = Split(LCase(SoughtList), Delimiter)
  End If
  
  For i = 0 To UBound(SoughtArray)
'Search items individually, encapsulated to ensure we get exact matches only
'Since the exact position is irrelevant, a binary search is done for better performance.
      MultiSearch = (InStr(strSearched, Delimiter & SoughtArray(i) & Delimiter) <> 0)
      If MultiSearch Then Exit For
  Next i

End Function

