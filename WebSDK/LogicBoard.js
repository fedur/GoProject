"use strict;"

/**
 * Copyright 2014 the HtmlGoBoard project authors.
 * All rights reserved.
 * Project  WebSDK
 * Author   Ilya Kirillov
 * Date     13.09.14
 * Time     3:26
 */

function CBoardKo()
{
    this.m_nMove     = 0; // Значение ход, который съел ко
    this.m_nCaptured = 0; // Значение камня, который был съеден на ко
}

CBoardKo.prototype.Reset = function()
{
    this.m_nMove     = 0;
    this.m_nCaptured = 0;
}
CBoardKo.prototype.Copy = function()
{
    var NewKo = new CBoardKo();
    NewKo.CopyFrom(this);
    return NewKo;
};
CBoardKo.prototype.CopyFrom = function(OtherKo)
{
    this.m_nMove     = OtherKo.m_nMove;
    this.m_nCaptured = OtherKo.m_nCaptured;
};
CBoardKo.prototype.Check = function(nMove, nCaptured)
{
    if (nCaptured === this.m_nMove && nMove === this.m_nCaptured)
        return true;

    return false;
};
CBoardKo.prototype.Set = function(nMove, nCaptured)
{
    this.m_nMove     = nMove;
    this.m_nCaptured = nCaptured;
};

function CBoardPoint(eValue, nNum)
{
    //this.m_eValue = Math.floor((Math.random() * 3));// (undefined === eValue ? BOARD_EMPTY : eValue);
    this.m_eValue = (undefined === eValue ? BOARD_EMPTY : eValue);
    this.m_nNum   = (undefined === nNum ? - 1 : nNum);
}
CBoardPoint.prototype.Clear = function()
{
    this.m_eValue = BOARD_EMPTY;
    this.m_nNum   = -1;
};
CBoardPoint.prototype.Set_Value = function(eValue)
{
    this.m_eValue = eValue;
};
CBoardPoint.prototype.Set_Num = function(Num)
{
    this.m_nNum = Num;
};
CBoardPoint.prototype.Get_Value = function()
{
    return this.m_eValue;
};
CBoardPoint.prototype.Get_Num = function()
{
    return this.m_nNum;
};
CBoardPoint.prototype.Copy_To = function(OtherPoint)
{
    OtherPoint.m_eValue = this.m_eValue;
    OtherPoint.m_nNum   = this.m_nNum;
};

function CDeadGroupChecker()
{
    this.m_aCurrentGroup = [];
    this.m_aSavedGroup   = [];
}
CDeadGroupChecker.prototype.Reset_Current = function()
{
    this.m_aCurrentGroup = [];
};
CDeadGroupChecker.prototype.Save_Current = function()
{
    // Здесь мы не проверяем совпали ли группы. Это должно происходить выше.
    this.m_aSavedGroup = this.m_aSavedGroup.concat(this.m_aCurrentGroup);
    this.m_aCurrentGroup = [];
};
CDeadGroupChecker.prototype.Get_Size = function()
{
    return this.m_aSavedGroup.length;
};
CDeadGroupChecker.prototype.Get_Value = function(Index)
{
    return this.m_aSavedGroup[Index];
};
/**
 * Проверяем находится ли заданный пункт в группе, если нет, тогда добавляем его в группу
 * @param nX
 * @param nY
 * @returns {boolean}
 */
CDeadGroupChecker.prototype.Is_StoneInCurrentGroup = function(nX, nY)
{
    var nValue = Common_XYtoValue(nX, nY);
    for (var nIndex = 0, nCount = this.m_aCurrentGroup.length; nIndex < nCount; nIndex++)
    {
        if (this.m_aCurrentGroup[nIndex] == nValue)
            return true;
    }

    // Добавляем камень в группу
    this.m_aCurrentGroup.push(nValue);
    return false;
};
CDeadGroupChecker.prototype.Is_StoneInSavedGroup = function(nX, nY)
{
    var nValue = Common_XYtoValue(nX, nY);
    for (var nIndex = 0, nCount = this.m_aSavedGroup.length; nIndex < nCount; nIndex++)
    {
        if (this.m_aSavedGroup[nIndex] == nValue)
            return true;
    }
    return false;
};

function CBoundaryScoreCounter()
{
    this.m_aPoints = {};
}
CBoundaryScoreCounter.prototype.Clear = function()
{
    this.m_aPoints = {};
};
CBoundaryScoreCounter.prototype.Is_PointIn = function(X, Y)
{
    var Place = Common_XYtoValue(X, Y);
    if (undefined !== this.m_aPoints[Place])
        return true;

    this.m_aPoints[Place] = 1;
    return false;
};
CBoundaryScoreCounter.prototype.Remove = function(X, Y)
{
    var Place = Common_XYtoValue(X, Y);
    if (undefined !== this.m_aPoints[Place])
        delete this.m_aPoints[Place];
};

function CAreaScoreCounter()
{
    this.m_oArea  = {};
    this.m_nOwner = BOARD_EMPTY;
};

CAreaScoreCounter.prototype.Clear = function()
{
    this.m_oArea  = {};
    this.m_nOwner = BOARD_EMPTY;
};
/**
 * Проверяем находится ли заданный пункт в области. Если нет, тогда добавляем его туда.
 * @param X
 * @param Y
 * @returns {boolean}
 */
CAreaScoreCounter.prototype.Is_PointIn = function(X, Y)
{
    var Place = Common_XYtoValue(X, Y);
    if (undefined !== this.m_oArea[Place])
        return true;

    this.m_oArea[Place] = 1;
    return false;
};
CAreaScoreCounter.prototype.Set_Owner = function(nValue)
{
    this.m_nOwner = nValue;
};
CAreaScoreCounter.prototype.Get_Owner = function()
{
    return this.m_nOwner;
};
CAreaScoreCounter.prototype.Update_Board = function(Board, nForceValue)
{
    var Value = (undefined === nForceValue ? this.m_nOwner : nForceValue);

    for (var Place in this.m_oArea)
    {
        var Pos = Common_ValuetoXY(Place | 0);
        Board.Set_ScorePoint(Pos.X, Pos.Y, Value);
    }
};

function CLogicBoard(nW, nH)
{
    this.m_nW = (undefined === nW ? 19 : nW); // количество пересечений по горизонтали
    this.m_nH = (undefined === nH ? 19 : nH); // количество пересечений по вертикали

    this.m_aBoard       = null; // Массив, в котором указаны значения пунктов на доске черный/белый/пустой
    this.private_InitBoard();

    this.m_oKo = new CBoardKo();

    this.m_aBoardScores = null; // Массив с метками территории
    this.m_oArea        = new CAreaScoreCounter();
    this.m_oBoundary    = new CBoundaryScoreCounter();

}
CLogicBoard.prototype.Clear = function()
{
    var nSize = this.m_nW * this.m_nH;
    for (var nIndex = 0; nIndex < nSize; nIndex++)
    {
        this.m_aBoard[nIndex].Clear();
    }
};
CLogicBoard.prototype.Get_Ko = function()
{
    return this.m_oKo.Copy();
};
CLogicBoard.prototype.Set_Ko = function(Ko)
{
    this.m_oKo.CopyFrom(Ko);
};
CLogicBoard.prototype.Reset_Ko = function()
{
    this.m_oKo.Reset();
};
CLogicBoard.prototype.Reset_Size = function(nW, nH)
{
    this.m_nW = nW;
    this.m_nH = nH;

    this.private_InitBoard();

    this.m_oKo.Reset();
};
CLogicBoard.prototype.Get_Size = function()
{
    return {X : this.m_nW, Y : this.m_nH};
};
CLogicBoard.prototype.Set = function(nX, nY, eValue, nNum)
{
    var nIndex = this.private_GetPos(nX, nY);
    this.m_aBoard[nIndex].Set_Value(eValue);

    if (undefined !== nNum && null !== nNum && -1 !== nNum)
        this.m_aBoard[nIndex].Set_Num(nNum);
};
CLogicBoard.prototype.Get = function(nX, nY)
{
    return this.m_aBoard[this.private_GetPos(nX, nY)].Get_Value();
};
CLogicBoard.prototype.Get_Num = function(nX, nY)
{
    return this.m_aBoard[this.private_GetPos(nX, nY)].Get_Num();
};
CLogicBoard.prototype.Check_Dead = function(nX, nY, eValue)
{
    var oChecker = new CDeadGroupChecker();
    this.private_CheckDead(nX, nY, eValue, oChecker);

    if (oChecker.Get_Size() > 0)
        return oChecker;
    else
        return null;
};
CLogicBoard.prototype.Check_Kill = function(nX, nY, eValue, bCheckKo)
{
    var eOtherValue;
    switch(eValue)
    {
        case BOARD_BLACK : eOtherValue = BOARD_WHITE; break;
        case BOARD_WHITE : eOtherValue = BOARD_BLACK; break;
        default : return null;
    }

    var oChecker = new CDeadGroupChecker();

    if (true !== oChecker.Is_StoneInSavedGroup(nX + 1, nY))
        this.private_CheckDead(nX + 1, nY, eOtherValue, oChecker);

    if (true !== oChecker.Is_StoneInSavedGroup(nX - 1, nY))
        this.private_CheckDead(nX - 1, nY, eOtherValue, oChecker);

    if (true !== oChecker.Is_StoneInSavedGroup(nX, nY + 1))
        this.private_CheckDead(nX, nY + 1, eOtherValue, oChecker);

    if (true !== oChecker.Is_StoneInSavedGroup(nX, nY - 1))
        this.private_CheckDead(nX, nY - 1, eOtherValue, oChecker);

    // Проверяем ко
    var nDeadCount = oChecker.Get_Size();
    if (1 == nDeadCount)
    {
        var nMove     = Common_XYtoValue(nX, nY);
        var nCaptured = oChecker.Get_Value(0);

        if (this.m_oKo.Check(nMove, nCaptured) && true == bCheckKo)
            return null;

        this.m_oKo.Set(nMove, nCaptured);
    }
    else if (nDeadCount > 1)
    {
        this.m_oKo.Reset();
    }
    else if (nDeadCount <= 0)
        return null;

    return oChecker;
};
CLogicBoard.prototype.Get_Copy = function()
{
    var Board = new CLogicBoard(this.m_nW, this.m_nH);

    var nSize = this.m_nW * this.m_nH;
    for (var nIndex = 0; nIndex < nSize; nIndex++)
    {
        this.m_aBoard[nIndex].Copy_To(Board.m_aBoard[nIndex]);
    }

    return Board;
};
CLogicBoard.prototype.private_InitBoard = function()
{
    var nSize = this.m_nW * this.m_nH;

    this.m_aBoard = new Array(nSize);
    for (var nIndex = 0; nIndex < nSize; nIndex++)
    {
        this.m_aBoard[nIndex] = new CBoardPoint();
    }
};
CLogicBoard.prototype.private_GetPos = function(nX, nY)
{
    return (nY - 1) * this.m_nW + (nX - 1);
};
/**
 * Ищем дамэ начиная с данного пункта, если данный пункт занят камнем того же цвета, тогда смотрим на
 * дамэ данного камня, если данный пункт не занят вообще, значит мы нашли дамэ, в последнем случае, дамэ
 * не ищем.
 * @param nX
 * @param nY
 * @param nValue
 * @param oChecker
 * @returns {boolean}
 */
CLogicBoard.prototype.private_IsDame = function(nX, nY, eValue, oChecker)
{
    if (nX > this.m_nW || nX < 1 || nY > this.m_nH || nY < 1)
        return false;

    var eThisValue = this.Get(nX, nY);

    if (BOARD_EMPTY === eThisValue)
        return true;
    else if (eValue === eThisValue)
        return this.private_CheckDame(nX, nY, eValue, oChecker);

    return false;
};
CLogicBoard.prototype.private_CheckDame = function(nX, nY, eValue, oChecker)
{
    if (true === oChecker.Is_StoneInCurrentGroup(nX, nY))
        return false;

    if (true === this.private_IsDame(nX + 1, nY, eValue, oChecker))
        return true;

    if (true === this.private_IsDame(nX - 1, nY, eValue, oChecker))
        return true;

    if (true === this.private_IsDame(nX, nY + 1, eValue, oChecker))
        return true;

    if (true === this.private_IsDame(nX, nY - 1, eValue, oChecker))
        return true;

    return false;
};
CLogicBoard.prototype.private_CheckDead = function(nX, nY, eValue, oChecker)
{
    if (nX > this.m_nW || nX < 1 || nY > this.m_nH || nY < 1)
        return 0;

    if (eValue !== this.Get(nX, nY))
        return 0;

    if (true === this.private_CheckDame(nX, nY, eValue, oChecker))
    {
        oChecker.Reset_Current();
        return false;
    }
    else
    {
        oChecker.Save_Current();
        return true;
    }
};
CLogicBoard.prototype.Init_CountScores = function()
{
    this.m_aBoardScores = [];
    for (var Y = 1; Y <= this.m_nH; Y++)
    {
        for (var X = 1; X <= this.m_nW; X++)
        {
            this.m_aBoardScores[this.private_GetPos(X, Y)] = BOARD_EMPTY;
        }
    }

    this.private_CheckAllEmptyAreas(false);
};
CLogicBoard.prototype.Set_ScorePoint = function(nX, nY, eValue)
{
    this.m_aBoardScores[this.private_GetPos(nX, nY)] = eValue;
};
CLogicBoard.prototype.Get_ScorePoint = function(nX, nY)
{
    return this.m_aBoardScores[this.private_GetPos(nX, nY)]
};
CLogicBoard.prototype.Count_Scores = function(oDrawingBoard)
{
    var nBlackScores = 0;
    var nWhiteScores = 0;

    for (var Y = 1; Y <= this.m_nH; Y++)
    {
        for (var X = 1; X <= this.m_nW; X++)
        {
            var oMark = null;
            var nOwner = this.Get_ScorePoint(X, Y);

            if (BOARD_BLACK === nOwner)
            {
                oMark = new CDrawingMark(X, Y, EDrawingMark.Tb, "");
                if (BOARD_WHITE === this.Get(X, Y))
                    nBlackScores += 2;
                else
                    nBlackScores++;
            }
            else if (BOARD_WHITE === nOwner)
            {
                oMark = new CDrawingMark(X, Y, EDrawingMark.Tw, "");
                if (BOARD_BLACK === this.Get(X, Y))
                    nWhiteScores += 2;
                else
                    nWhiteScores++;
            }

            if (null === oMark)
                oDrawingBoard.Remove_Mark(X, Y);
            else
                oDrawingBoard.Add_Mark(oMark);
        }
    }

    return {Black : nBlackScores, White : nWhiteScores};
};
CLogicBoard.prototype.Select_DeadGroup = function(X, Y)
{
    var Value = this.Get(X, Y);
    if (BOARD_EMPTY === Value)
        return;

    this.m_oBoundary.Clear();
    var nOwner = this.Get_ScorePoint(X, Y);
    if (BOARD_BLACK !== nOwner && BOARD_WHITE !== nOwner)
    {
        // Сначала найдем область в которую мы заносим пустые пункты и пункты заданного цвета.
        this.m_oArea.Clear();
        this.private_CheckBoundary(X, Y, Value);

        for (var Place in this.m_oBoundary.m_aPoints)
        {
            var Pos = Common_ValuetoXY(Place | 0);
            this.m_oArea.Clear();
            this.private_CheckEmptyAreaByXYAndValue(Pos.X, Pos.Y, BOARD_DRAW - Value);
            this.m_oArea.Update_Board(this, BOARD_DRAW);
        }

        this.private_CheckAllEmptyAreas(true);

        this.m_oArea.Clear();
        this.private_CheckBoundary(X, Y, Value);
        this.m_oArea.Update_Board(this, BOARD_DRAW - Value);
    }
    else
    {
        this.m_oArea.Clear();
        this.private_CheckBoundary(X, Y, Value);
        this.m_oArea.Update_Board(this, BOARD_DRAW);
        this.private_CheckAllEmptyAreas(true);
    }
};
CLogicBoard.prototype.private_CheckEmptyAreaByXY = function(X, Y)
{
    if (X > this.m_nW || X < 1 || Y > this.m_nH || Y < 1)
        return;

    var nCurValue = this.Get(X, Y);
    if (BOARD_EMPTY !== this.Get(X, Y))
    {
        var nOwner = this.m_oArea.Get_Owner();
        switch (nOwner)
        {
            case BOARD_EMPTY:
            {
                this.m_oArea.Set_Owner(nCurValue);
                break;
            }
            case BOARD_BLACK:
            case BOARD_WHITE:
            {
                if (nOwner !== nCurValue)
                    this.m_oArea.Set_Owner(BOARD_DRAW);
                break;
            }
            case BOARD_DRAW:
                break;
        }
        return;
    }

    if (false === this.m_oArea.Is_PointIn(X, Y))
    {
        this.private_CheckEmptyAreaByXY(X + 1, Y);
        this.private_CheckEmptyAreaByXY(X - 1, Y);
        this.private_CheckEmptyAreaByXY(X, Y + 1);
        this.private_CheckEmptyAreaByXY(X, Y - 1);
    }
};
CLogicBoard.prototype.private_CheckBoundary = function(X, Y, Value)
{
    if (X > this.m_nW || X < 1 || Y > this.m_nH || Y < 1)
        return;

    if ((BOARD_DRAW - Value) === this.Get(X, Y))
    {
        if (Value === this.Get_ScorePoint(X, Y))
            this.m_oBoundary.Is_PointIn(X, Y);

        return;
    }

    if (true !== this.m_oArea.Is_PointIn(X, Y))
    {
        this.private_CheckBoundary(X + 1, Y, Value);
        this.private_CheckBoundary(X - 1, Y, Value);
        this.private_CheckBoundary(X, Y + 1, Value);
        this.private_CheckBoundary(X, Y - 1, Value);
    }
};
CLogicBoard.prototype.private_CheckEmptyAreaByXYAndValue = function(X, Y, Value)
{
    if (X > this.m_nW || X < 1 || Y > this.m_nH || Y < 1)
        return;

    if ((BOARD_DRAW - Value) === this.Get(X, Y))
        return;
    else if (Value === this.Get(X, Y))
        this.m_oBoundary.Remove(X, Y);

    if (true !== this.m_oArea.Is_PointIn(X, Y))
    {
        this.private_CheckEmptyAreaByXYAndValue(X + 1, Y, Value);
        this.private_CheckEmptyAreaByXYAndValue(X - 1, Y, Value);
        this.private_CheckEmptyAreaByXYAndValue(X, Y + 1, Value);
        this.private_CheckEmptyAreaByXYAndValue(X, Y - 1, Value);
    }
};
CLogicBoard.prototype.private_CheckAllEmptyAreas = function(bCheckDraw)
{
    for (var Y = 1; Y <= this.m_nH; Y++)
    {
        for (var X = 1; X <= this.m_nW; X++)
        {
            if (BOARD_EMPTY === this.Get(X, Y) && (BOARD_EMPTY === this.Get_ScorePoint(X, Y) || (true === bCheckDraw && BOARD_DRAW === this.Get_ScorePoint(X, Y))))
            {
                this.m_oArea.Clear();
                this.private_CheckEmptyAreaByXY( X, Y );
                this.m_oArea.Update_Board(this);
            }
        }
    }
};