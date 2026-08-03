Attribute VB_Name = "MiscRoutines"
Option Explicit
Sub appWait()
    With Application
        .Cursor = xlWait
        .CutCopyMode = False
        .ScreenUpdating = False
        .Calculation = xlManual
    End With
End Sub
Sub appDefault()
    With Application
        .Cursor = xlDefault
        .CutCopyMode = False
        .ScreenUpdating = True
        .Calculation = xlAutomatic
    End With
End Sub
Function RaceLookup(lookupString As Variant, lookupTable As Range, raceID As Range, cleanIt As Boolean) As Variant
    ' Helper function to make the interface formulae neater
    Dim temp As Variant
    Dim temp2 As String
    Dim inpString As Variant
    Dim id As Double
    
    id = raceID.Value
    
    If TypeOf lookupString Is Range Then
        inpString = lookupString.Value
    Else
        inpString = lookupString
    End If
            
    With Application.WorksheetFunction
        temp = .Index(lookupTable, id, .Match(inpString, .Index(lookupTable, 1, 0), 0))
        If Left(temp, 4) = "ref:" Then
            temp2 = Right(temp, Len(temp) - 4)
            temp = Range(temp2).Value
        End If
    
        If cleanIt Then
            temp = .clean(temp)
        End If
    End With
    
    RaceLookup = temp
    
End Function
Function WordWrap(inpString As Variant, charsPerLine As Integer) As String
   ' Take the input string, wrap at the number of characters per line, and return an array of the wrapped
   ' lines. Note that we don't want to blindly take that many characters - we want to end each line with a
   ' space.
   Dim retStr As String
   Dim temp As String
   Dim temp2 As String
   Dim numChars As Integer
   
   temp = inpString
   
   retStr = ""
      
   While Len(temp) > charsPerLine
      temp2 = Left(temp, charsPerLine + 1)
      If InStr(temp2, " ") <> 0 Then ' If there's a space somewhere in the block
         ' Take the last space as the point to wrap - so find the last space in the line
         While Right(temp2, 1) <> " "
            temp2 = Left(temp2, Len(temp2) - 1)
         Wend
         ' Get rid of the tailing space
         temp2 = Left(temp2, Len(temp2) - 1)
         numChars = 2   ' Only 1 character (the space) will need to be skipped
      Else   ' None of the above happened. There wasn't a single space to divide the string. Just take
         ' that number of characters and "wrap" there. It won't look "nice", but it has to be done.
         temp2 = Left(temp, charsPerLine)
         numChars = 0   ' Nothing will be skipped
      End If
      
      If Len(temp2) <> 0 Then ' If there's something to add
         retStr = retStr + temp2 + Chr(10)
      End If
      temp = Mid(temp, Len(temp2) + numChars) ' Remove those characters from the input string
      temp = "  " + temp                      ' add two space at the beginning for alignment
   Wend
   If Trim(temp) <> "" Then   ' Check to see if there are any characters left that haven't been processed yet
     retStr = retStr + temp
   End If
   
   
   WordWrap = retStr   ' Return the array of strings (defined as a variant)
End Function
Function NewWordWrap(inpString As Variant, charsPerLine As Integer) As String
   Dim retStr As Variant
   Dim temp As String
   Dim temp2 As String
   Dim temp3 As String
   Dim temp4 As String
   Dim numChars As Integer
   Dim pos As Integer
   Dim Pos2 As Integer
      
   temp = inpString
   
   retStr = ""
   temp2 = ""
   temp3 = ""
   temp4 = ""
      
   While Len(temp) > 0
        pos = InStr(temp, Chr(10))
        If pos <> 0 Then
            temp4 = ""
            temp3 = ""
            temp2 = Left(temp, pos)
            temp = Right(temp, Len(temp) - pos)
            While Len(temp2) > 0
                Pos2 = InStr(temp2, " ")
                If Pos2 <> 0 Then
                    temp4 = temp3 + Left(temp2, Pos2)
                    If Len(temp4) > charsPerLine Then
                        retStr = retStr + temp3 + Chr(10)
                        temp3 = Left(temp2, Pos2)
                    Else
                        temp3 = temp4
                    End If
                    temp2 = Right(temp2, Len(temp2) - Pos2)
                Else
                    temp3 = temp3 + temp2
                    temp2 = ""
                End If
            Wend
            retStr = retStr + temp3
        Else
            retStr = retStr + temp
            temp = ""
        End If
    Wend
       
    NewWordWrap = retStr
End Function
Sub WordWrapAbilities(ioRef1 As String, ioRef2 As String)
    
    '¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\
    ' Sub WordWrapAbilities takes two arguments:
    ' ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
    ' ioRef1       : String representing the name equivalent of the first display segment
    ' ioRef2       : String representing the name equivalent of the second display segment
    '
    ' The following variables are also defined:
    ' ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
    ' strFullStr   : Contains the full source string to be wordwrapped (from refCellSrc.Value)
    ' intStrLen    : Number of characters in strFullStr
    ' arrLines     : Array where each element is one line from strFullStr (split by vbLf)
    ' intLineCnt   : Number of arrLines elements
    '
    ' intStrLvl    : As arrLines is walked, this takes on a value of 1 or 2, indicating whether the
    '              : current string is a top-level or sub-level string
    '
    ' intStrWidth  : The width (in pixels) of the current line prepared for output
    ' strTemp1     : Temporary string holder of processed and committed data
    ' strTemp2     : Temporary string holder of processed but not yet commited data
    ' intTemp1     : Temporary counter of lines committed for output
    '
    ' arrCharWidth : The width (in pixels) of each character between 32 and 255 (character codes) as
    '              : measured at 16 point font size
    '
    ' intAreaW     : The width (in pixels, with small adjustment) of current display segment
    ' intAreaW1    : The width (in pixels, with small adjustment) of the first display segment
    ' intAreaW2    : The width (in pixels, with small adjustment) of the second display segment
    '
    ' intAreaH     : The height (in rows, adjusted for font size) of current display segment
    ' intAreaH1    : The height (in rows, adjusted for font size) of the first display segment
    ' intAreaH2    : The height (in rows, adjusted for font size) of the second display segment
    '
    ' refCell1     : A range object, pointing to the first display segment
    ' refCell2     : A range object, pointing to the second display segment
    ' refCellSrc   : A range object, pointing to the data source segment
    '
    ' refTarget    : A range object, pointing to the current output cell
    ' refTarget1   : A range object, pointing to the CSAbilities1 named range
    ' refTarget2   : A range object, pointing to the CSAbilities2 named range
    '
    ' dblSz        : Variable applied in all calculations, allowing adjustment for font size
    ' dblSz1       : The font size adjustment variable for the first display segment (? / 16)
    ' dblSz2       : The font size adjustment variable for the second display segment (? / 16)
    '
    ' i, j, k      : Simple counters
    '
    ' * We distinguish between display segments (on CSII or CSIII) and output cells (on CS_Calc.)
    '_______________________________________________________________________________________________/
    
    On Error Resume Next
    
    Dim strFullStr As String, intStrLen As Integer, arrLines As Variant, intLineCnt As Integer, intStrLvl As Integer
    Dim intStrWidth As Integer, strTemp1 As String, strTemp2 As String, intTemp1 As Integer
    Dim strTopLvl As String, strSubLvl As String
    Dim arrCharWidth(32 To 255) As Integer
    Dim intAreaW As Integer, intAreaW1 As Integer, intAreaW2 As Integer
    Dim intAreaH As Integer, intAreaH1 As Integer, intAreaH2 As Integer
    Dim refCell1 As Range, refCell2 As Range, refCellSrc As Range
    Dim refTarget As Range, refTarget1 As Range, refTarget2 As Range
    Dim dblSz As Double, dblSz1 As Double, dblSz2 As Double
    Dim i As Integer, j As Integer, k As Integer
    
    ' Set pointers to various display segments -- references for calculations
    Set refCell1 = ActiveWorkbook.Names(ioRef1).RefersToRange
    Set refCell2 = ActiveWorkbook.Names(ioRef2).RefersToRange
    Set refCellSrc = ActiveWorkbook.Names("TblAbilities").RefersToRange
    
    ' Set pointers to data output target cells -- data holders only
    Set refTarget1 = ActiveWorkbook.Names("CSAbilities1").RefersToRange
    Set refTarget2 = ActiveWorkbook.Names("CSAbilities2").RefersToRange
    Set refTarget = refTarget1
    
    ' Read in and pre-process data
    strFullStr = refCellSrc.Value
    intStrLen = Len(strFullStr)
    arrLines = Split(strFullStr, vbLf)
    intLineCnt = UBound(arrLines)
    
    ' Exit if no data exists
    If strFullStr = "" Then
        GoTo EndFunc
    End If
    
    ' Set bullets to user choice
    strTopLvl = Range("BulletTopLevelTxt").Value & " "
    strSubLvl = "   " & Range("BulletSubLevelTxt").Value & " "
    
    ' Reset data output target cells
    refTarget1.Value = ""
    refTarget2.Value = ""
    
    ' Determine font size adjustment
    dblSz1 = refCell1.Characters.Font.Size / 16
    dblSz2 = refCell2.Characters.Font.Size / 16
    dblSz = dblSz1
    
    ' Determine display segment widths
    intAreaW1 = (refCell1.Width * 96 / 72) - 40 - (40 * (dblSz1 - 1) * 2)
    intAreaW2 = (refCell2.Width * 96 / 72) - 40 - (40 * (dblSz2 - 1) * 2)
    intAreaW = intAreaW1
    
    ' Determine max display segment row count
    intAreaH1 = Int( _
        ( _
            refCell1.Height * 96 / 72 / ( _
                ( _
                    refCell1.Characters.Font.Size * 1.5 _
                ) + 3 + _
                IIf(dblSz1 < 1, -1, _
                    IIf(dblSz1 > 1.125, Application.Max((dblSz1 - 1) / -0.125, -3), 0) _
                ) _
            ) _
        ) _
    ) - Int((5 * dblSz1) + 0.5) - IIf(refCell1.Characters.Font.Size = 20, 1, 0)
    intAreaH2 = Int( _
        ( _
            refCell2.Height * 96 / 72 / ( _
                ( _
                    refCell2.Characters.Font.Size * 1.5 _
                ) + 3 + _
                IIf(dblSz2 < 1, -1, _
                    IIf(dblSz2 > 1.125, Application.Max((dblSz2 - 1) / -0.125, -3), 0) _
                ) _
            ) _
        ) _
    ) - Int((5 * dblSz2) + 0.5) - IIf(refCell2.Characters.Font.Size = 20, 1, 0)
    intAreaH = intAreaH1
    
    ' Define character widths -- DO NOT EDIT!!
    arrCharWidth(32) = 6       ' DO NOT EDIT!!
    arrCharWidth(33) = 6       ' DO NOT EDIT!!
    arrCharWidth(34) = 7       ' DO NOT EDIT!!
    arrCharWidth(35) = 12      ' DO NOT EDIT!!
    arrCharWidth(36) = 12      ' DO NOT EDIT!!
    arrCharWidth(37) = 19      ' DO NOT EDIT!!
    arrCharWidth(38) = 14      ' DO NOT EDIT!!
    arrCharWidth(39) = 4       ' DO NOT EDIT!!
    arrCharWidth(40) = 7       ' DO NOT EDIT!!
    arrCharWidth(41) = 7       ' DO NOT EDIT!!
    arrCharWidth(42) = 8       ' DO NOT EDIT!!
    arrCharWidth(43) = 12      ' DO NOT EDIT!!
    arrCharWidth(44) = 6       ' DO NOT EDIT!!
    arrCharWidth(45) = 7       ' DO NOT EDIT!!
    arrCharWidth(46) = 6       ' DO NOT EDIT!!
    arrCharWidth(47) = 6       ' DO NOT EDIT!!
    arrCharWidth(48) = 12      ' DO NOT EDIT!!
    arrCharWidth(49) = 12      ' DO NOT EDIT!!
    arrCharWidth(50) = 12      ' DO NOT EDIT!!
    arrCharWidth(51) = 12      ' DO NOT EDIT!!
    arrCharWidth(52) = 12      ' DO NOT EDIT!!
    arrCharWidth(53) = 12      ' DO NOT EDIT!!
    arrCharWidth(54) = 12      ' DO NOT EDIT!!
    arrCharWidth(55) = 12      ' DO NOT EDIT!!
    arrCharWidth(56) = 12      ' DO NOT EDIT!!
    arrCharWidth(57) = 12      ' DO NOT EDIT!!
    arrCharWidth(58) = 6       ' DO NOT EDIT!!
    arrCharWidth(59) = 6       ' DO NOT EDIT!!
    arrCharWidth(60) = 12      ' DO NOT EDIT!!
    arrCharWidth(61) = 12      ' DO NOT EDIT!!
    arrCharWidth(62) = 12      ' DO NOT EDIT!!
    arrCharWidth(63) = 12      ' DO NOT EDIT!!
    arrCharWidth(64) = 21      ' DO NOT EDIT!!
    arrCharWidth(65) = 13      ' DO NOT EDIT!!
    arrCharWidth(66) = 14      ' DO NOT EDIT!!
    arrCharWidth(67) = 15      ' DO NOT EDIT!!
    arrCharWidth(68) = 15      ' DO NOT EDIT!!
    arrCharWidth(69) = 14      ' DO NOT EDIT!!
    arrCharWidth(70) = 13      ' DO NOT EDIT!!
    arrCharWidth(71) = 16      ' DO NOT EDIT!!
    arrCharWidth(72) = 14      ' DO NOT EDIT!!
    arrCharWidth(73) = 6       ' DO NOT EDIT!!
    arrCharWidth(74) = 11      ' DO NOT EDIT!!
    arrCharWidth(75) = 14      ' DO NOT EDIT!!
    arrCharWidth(76) = 12      ' DO NOT EDIT!!
    arrCharWidth(77) = 17      ' DO NOT EDIT!!
    arrCharWidth(78) = 14      ' DO NOT EDIT!!
    arrCharWidth(79) = 16      ' DO NOT EDIT!!
    arrCharWidth(80) = 14      ' DO NOT EDIT!!
    arrCharWidth(81) = 16      ' DO NOT EDIT!!
    arrCharWidth(82) = 15      ' DO NOT EDIT!!
    arrCharWidth(83) = 14      ' DO NOT EDIT!!
    arrCharWidth(84) = 12      ' DO NOT EDIT!!
    arrCharWidth(85) = 14      ' DO NOT EDIT!!
    arrCharWidth(86) = 13      ' DO NOT EDIT!!
    arrCharWidth(87) = 21      ' DO NOT EDIT!!
    arrCharWidth(88) = 14      ' DO NOT EDIT!!
    arrCharWidth(89) = 14      ' DO NOT EDIT!!
    arrCharWidth(90) = 13      ' DO NOT EDIT!!
    arrCharWidth(91) = 6       ' DO NOT EDIT!!
    arrCharWidth(92) = 6       ' DO NOT EDIT!!
    arrCharWidth(93) = 6       ' DO NOT EDIT!!
    arrCharWidth(94) = 8       ' DO NOT EDIT!!
    arrCharWidth(95) = 12      ' DO NOT EDIT!!
    arrCharWidth(96) = 7       ' DO NOT EDIT!!
    arrCharWidth(97) = 12      ' DO NOT EDIT!!
    arrCharWidth(98) = 11      ' DO NOT EDIT!!
    arrCharWidth(99) = 11      ' DO NOT EDIT!!
    arrCharWidth(100) = 11     ' DO NOT EDIT!!
    arrCharWidth(101) = 12     ' DO NOT EDIT!!
    arrCharWidth(102) = 6      ' DO NOT EDIT!!
    arrCharWidth(103) = 11     ' DO NOT EDIT!!
    arrCharWidth(104) = 11     ' DO NOT EDIT!!
    arrCharWidth(105) = 5      ' DO NOT EDIT!!
    arrCharWidth(106) = 4      ' DO NOT EDIT!!
    arrCharWidth(107) = 10     ' DO NOT EDIT!!
    arrCharWidth(108) = 4      ' DO NOT EDIT!!
    arrCharWidth(109) = 16     ' DO NOT EDIT!!
    arrCharWidth(110) = 11     ' DO NOT EDIT!!
    arrCharWidth(111) = 12     ' DO NOT EDIT!!
    arrCharWidth(112) = 11     ' DO NOT EDIT!!
    arrCharWidth(113) = 11     ' DO NOT EDIT!!
    arrCharWidth(114) = 7      ' DO NOT EDIT!!
    arrCharWidth(115) = 11     ' DO NOT EDIT!!
    arrCharWidth(116) = 6      ' DO NOT EDIT!!
    arrCharWidth(117) = 11     ' DO NOT EDIT!!
    arrCharWidth(118) = 11     ' DO NOT EDIT!!
    arrCharWidth(119) = 15     ' DO NOT EDIT!!
    arrCharWidth(120) = 10     ' DO NOT EDIT!!
    arrCharWidth(121) = 11     ' DO NOT EDIT!!
    arrCharWidth(122) = 9      ' DO NOT EDIT!!
    arrCharWidth(123) = 7      ' DO NOT EDIT!!
    arrCharWidth(124) = 6      ' DO NOT EDIT!!
    arrCharWidth(125) = 7      ' DO NOT EDIT!!
    arrCharWidth(126) = 12     ' DO NOT EDIT!!
    arrCharWidth(149) = 7      ' DO NOT EDIT!!
    arrCharWidth(150) = 12     ' DO NOT EDIT!!
    arrCharWidth(151) = 21     ' DO NOT EDIT!!
    arrCharWidth(152) = 7      ' DO NOT EDIT!!
    arrCharWidth(153) = 21     ' DO NOT EDIT!!
    arrCharWidth(154) = 11     ' DO NOT EDIT!!
    arrCharWidth(155) = 7      ' DO NOT EDIT!!
    arrCharWidth(156) = 20     ' DO NOT EDIT!!
    arrCharWidth(157) = 16     ' DO NOT EDIT!!
    arrCharWidth(158) = 9      ' DO NOT EDIT!!
    arrCharWidth(159) = 14     ' DO NOT EDIT!!
    arrCharWidth(160) = 6      ' DO NOT EDIT!!
    arrCharWidth(161) = 6      ' DO NOT EDIT!!
    arrCharWidth(162) = 12     ' DO NOT EDIT!!
    arrCharWidth(163) = 12     ' DO NOT EDIT!!
    arrCharWidth(164) = 12     ' DO NOT EDIT!!
    arrCharWidth(165) = 12     ' DO NOT EDIT!!
    arrCharWidth(166) = 6      ' DO NOT EDIT!!
    arrCharWidth(167) = 12     ' DO NOT EDIT!!
    arrCharWidth(168) = 7      ' DO NOT EDIT!!
    arrCharWidth(169) = 15     ' DO NOT EDIT!!
    arrCharWidth(170) = 7      ' DO NOT EDIT!!
    arrCharWidth(171) = 12     ' DO NOT EDIT!!
    arrCharWidth(172) = 12     ' DO NOT EDIT!!
    arrCharWidth(173) = 0      ' Yes, 0 width!
    arrCharWidth(174) = 15     ' DO NOT EDIT!!
    arrCharWidth(175) = 12     ' DO NOT EDIT!!
    arrCharWidth(176) = 8      ' DO NOT EDIT!!
    arrCharWidth(177) = 12     ' DO NOT EDIT!!
    arrCharWidth(178) = 7      ' DO NOT EDIT!!
    arrCharWidth(179) = 7      ' DO NOT EDIT!!
    arrCharWidth(180) = 7      ' DO NOT EDIT!!
    arrCharWidth(181) = 11     ' DO NOT EDIT!!
    arrCharWidth(182) = 11     ' DO NOT EDIT!!
    arrCharWidth(183) = 6      ' DO NOT EDIT!!
    arrCharWidth(184) = 7      ' DO NOT EDIT!!
    arrCharWidth(185) = 7      ' DO NOT EDIT!!
    arrCharWidth(186) = 8      ' DO NOT EDIT!!
    arrCharWidth(187) = 12     ' DO NOT EDIT!!
    arrCharWidth(188) = 18     ' DO NOT EDIT!!
    arrCharWidth(189) = 18     ' DO NOT EDIT!!
    arrCharWidth(190) = 18     ' DO NOT EDIT!!
    arrCharWidth(191) = 13     ' DO NOT EDIT!!
    arrCharWidth(192) = 13     ' DO NOT EDIT!!
    arrCharWidth(193) = 13     ' DO NOT EDIT!!
    arrCharWidth(194) = 13     ' DO NOT EDIT!!
    arrCharWidth(195) = 13     ' DO NOT EDIT!!
    arrCharWidth(196) = 13     ' DO NOT EDIT!!
    arrCharWidth(197) = 13     ' DO NOT EDIT!!
    arrCharWidth(198) = 21     ' DO NOT EDIT!!
    arrCharWidth(199) = 15     ' DO NOT EDIT!!
    arrCharWidth(200) = 14     ' DO NOT EDIT!!
    arrCharWidth(201) = 14     ' DO NOT EDIT!!
    arrCharWidth(202) = 14     ' DO NOT EDIT!!
    arrCharWidth(203) = 14     ' DO NOT EDIT!!
    arrCharWidth(204) = 6      ' DO NOT EDIT!!
    arrCharWidth(205) = 6      ' DO NOT EDIT!!
    arrCharWidth(206) = 6      ' DO NOT EDIT!!
    arrCharWidth(207) = 6      ' DO NOT EDIT!!
    arrCharWidth(208) = 15     ' DO NOT EDIT!!
    arrCharWidth(209) = 14     ' DO NOT EDIT!!
    arrCharWidth(210) = 16     ' DO NOT EDIT!!
    arrCharWidth(211) = 16     ' DO NOT EDIT!!
    arrCharWidth(212) = 16     ' DO NOT EDIT!!
    arrCharWidth(213) = 16     ' DO NOT EDIT!!
    arrCharWidth(214) = 16     ' DO NOT EDIT!!
    arrCharWidth(215) = 12     ' DO NOT EDIT!!
    arrCharWidth(216) = 16     ' DO NOT EDIT!!
    arrCharWidth(217) = 14     ' DO NOT EDIT!!
    arrCharWidth(218) = 14     ' DO NOT EDIT!!
    arrCharWidth(219) = 14     ' DO NOT EDIT!!
    arrCharWidth(220) = 14     ' DO NOT EDIT!!
    arrCharWidth(221) = 14     ' DO NOT EDIT!!
    arrCharWidth(222) = 14     ' DO NOT EDIT!!
    arrCharWidth(223) = 13     ' DO NOT EDIT!!
    arrCharWidth(224) = 12     ' DO NOT EDIT!!
    arrCharWidth(225) = 12     ' DO NOT EDIT!!
    arrCharWidth(226) = 12     ' DO NOT EDIT!!
    arrCharWidth(227) = 12     ' DO NOT EDIT!!
    arrCharWidth(228) = 12     ' DO NOT EDIT!!
    arrCharWidth(229) = 12     ' DO NOT EDIT!!
    arrCharWidth(230) = 19     ' DO NOT EDIT!!
    arrCharWidth(231) = 11     ' DO NOT EDIT!!
    arrCharWidth(232) = 12     ' DO NOT EDIT!!
    arrCharWidth(233) = 12     ' DO NOT EDIT!!
    arrCharWidth(234) = 12     ' DO NOT EDIT!!
    arrCharWidth(235) = 12     ' DO NOT EDIT!!
    arrCharWidth(236) = 6      ' DO NOT EDIT!!
    arrCharWidth(237) = 6      ' DO NOT EDIT!!
    arrCharWidth(238) = 6      ' DO NOT EDIT!!
    arrCharWidth(239) = 6      ' DO NOT EDIT!!
    arrCharWidth(240) = 12     ' DO NOT EDIT!!
    arrCharWidth(241) = 11     ' DO NOT EDIT!!
    arrCharWidth(242) = 12     ' DO NOT EDIT!!
    arrCharWidth(243) = 12     ' DO NOT EDIT!!
    arrCharWidth(244) = 12     ' DO NOT EDIT!!
    arrCharWidth(245) = 12     ' DO NOT EDIT!!
    arrCharWidth(246) = 12     ' DO NOT EDIT!!
    arrCharWidth(247) = 12     ' DO NOT EDIT!!
    arrCharWidth(248) = 12     ' DO NOT EDIT!!
    arrCharWidth(249) = 11     ' DO NOT EDIT!!
    arrCharWidth(250) = 11     ' DO NOT EDIT!!
    arrCharWidth(251) = 11     ' DO NOT EDIT!!
    arrCharWidth(252) = 11     ' DO NOT EDIT!!
    arrCharWidth(253) = 11     ' DO NOT EDIT!!
    arrCharWidth(254) = 12     ' DO NOT EDIT!!
    arrCharWidth(255) = 11     ' DO NOT EDIT!!
    
    ' Initialize default counter values
    strTemp1 = ""
    intTemp1 = 0
    
    ' This is where the magic starts ...
    For i = 0 To intLineCnt - 1
        intStrWidth = 0
        If Left(arrLines(i), 2) = "× " Then
            ' Top-level strings are expected to be prefixed with "× "
            arrLines(i) = strTopLvl & Mid(arrLines(i), 3)
            intStrLvl = 1
        Else
            ' Sub-level strings are expected to be prefixed with "   × "
            If Left(arrLines(i), 2) = "  " Then
                arrLines(i) = strSubLvl & Mid(arrLines(i), 6)
            End If
            intStrLvl = 2
        End If
        strTemp2 = ""
        ' Walk the lines ...
        For j = 1 To Len(arrLines(i))
            ' ... one character at a time
            intStrWidth = intStrWidth + (arrCharWidth(Asc(Mid(arrLines(i), j, 1))) * dblSz)
            If intStrWidth > intAreaW Then
                ' We need to initiate a word wrap ...
                intTemp1 = intTemp1 + 1 ' ... which means we are adding another line
                strTemp1 = RTrim(strTemp1)
                If intTemp1 > intAreaH And refTarget.Value = "" Then
                    ' We have exceeded the max number of rows in the display area ...
                    refTarget.Value = strTemp1 ' ... output committed data
                    strTemp1 = ""              ' ... reset strings
                    intTemp1 = 0               ' ... and counters
                    If refTarget = refTarget1 Then
                        ' Continue with the second display area ...
                        ' Reinitialize "current" variables ...
                        intAreaW = intAreaW2
                        intAreaH = intAreaH2
                        Set refTarget = refTarget2
                        dblSz = dblSz2
                    Else
                        ' We are out of display areas and need to force an exit ...
                        ' TODO: How do we indicate to the user that some of the text did not fit?
                        GoTo EndFunc
                    End If
                Else
                    ' ... commit that line we just added
                    strTemp1 = strTemp1 & vbLf
                End If
                ' Stringify the beginning of next line as appropriate ...
                If intStrLvl = 1 Then
                    ' ... for top-level strings
                    If Left(strTemp2, 1) = " " Then
                        strTemp1 = strTemp1 & "  "
                        intStrWidth = arrCharWidth(Asc(" ")) * 2 * dblSz
                    Else
                        strTemp1 = strTemp1 & "   "
                        intStrWidth = arrCharWidth(Asc(" ")) * 3 * dblSz
                    End If
                Else
                    ' ... for sub-level strings
                    If Left(strTemp2, 1) = " " Then
                        strTemp1 = strTemp1 & "     "
                        intStrWidth = arrCharWidth(Asc(" ")) * 5 * dblSz
                    Else
                        strTemp1 = strTemp1 & "      "
                        intStrWidth = arrCharWidth(Asc(" ")) * 6 * dblSz
                    End If
                End If
                ' Process not-yet-commited data that "did not fit" ...
                If Len(strTemp2) > 0 Then
                    For k = 1 To Len(strTemp2)
                        intStrWidth = intStrWidth + (arrCharWidth(Asc(Mid(strTemp2, k, 1))) * dblSz)
                    Next k
                End If
                intStrWidth = intStrWidth + (arrCharWidth(Asc(Mid(arrLines(i), j, 1))) * dblSz)
            End If
            ' Add the just processed character ...
            strTemp2 = strTemp2 & Mid(arrLines(i), j, 1)
            If InStr(".,;:!? ", Mid(arrLines(i), j, 1)) Or j = Len(arrLines(i)) Then
                ' ... and commit the string if the just-processed character is one of ".,;:!? "
                ' ... or is the end of the current line
                strTemp1 = strTemp1 & strTemp2
                strTemp2 = ""
            End If
        Next j
        ' The last bit of not-yet-commited data always results in a new line ...
        intTemp1 = intTemp1 + 1
        If intTemp1 > intAreaH And refTarget.Value = "" Then
            ' We have exceeded the max number of rows in the display area ...
            refTarget.Value = strTemp1 ' ... output committed data
            strTemp1 = ""              ' ... reset strings
            intTemp1 = 0               ' ... and counters
            If refTarget = refTarget1 Then
                ' Continue with the second display area ...
                ' Reinitialize "current" variables ...
                intAreaW = intAreaW2
                intAreaH = intAreaH2
                Set refTarget = refTarget2
                dblSz = dblSz2
            Else
                ' We are out of display areas and need to force an exit ...
                ' TODO: How do we indicate to the user that some of the text did not fit?
                GoTo EndFunc
            End If
        Else
            ' ... commit that line we just added
            strTemp1 = strTemp1 & strTemp2 & vbLf
        End If
    Next i
    
    ' We ran to completion, and will now perform a clean exit ...
    If refTarget.Value = "" Then
        ' Any not-yet-output, although committed, data should now be output ...
        refTarget.Value = strTemp1
    Else
        ' TODO: How do we indicate to the user that some of the text did not fit?
    End If
    GoTo EndFunc
    
EndFunc:
    
End Sub
