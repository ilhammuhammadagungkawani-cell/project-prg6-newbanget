USE [master];
GO

-- 1. Drop existing database if exists to ensure a clean setup with the new schema
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'find_mahasiswa_db')
BEGIN
    ALTER DATABASE [find_mahasiswa_db] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [find_mahasiswa_db];
END
GO

-- 2. Create Database
CREATE DATABASE [find_mahasiswa_db];
GO

USE [find_mahasiswa_db];
GO

-- 3. Create Users Table
CREATE TABLE [dbo].[Users](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [name] [varchar](100) NOT NULL,
    [email] [varchar](100) NOT NULL,
    [password] [varchar](255) NOT NULL,
    [created_at] [datetime] NULL DEFAULT (GETDATE()),
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED ([email] ASC)
);
GO

-- 4. Create FinanceData Table
CREATE TABLE [dbo].[FinanceData](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [user_email] [varchar](100) NOT NULL,
    [initial_balance] [decimal](18, 2) NOT NULL,
    [current_balance] [decimal](18, 2) NOT NULL,
    [updated_at] [datetime] NULL DEFAULT (GETDATE()),
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_FinanceData_UserEmail] UNIQUE NONCLUSTERED ([user_email] ASC),
    CONSTRAINT [FK_FinanceData_Users] FOREIGN KEY ([user_email]) REFERENCES [dbo].[Users] ([email]) ON DELETE CASCADE
);
GO

-- 5. Create Transactions Table
CREATE TABLE [dbo].[Transactions](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [user_email] [varchar](100) NOT NULL,
    [type] [varchar](20) NOT NULL,
    [amount] [decimal](18, 2) NOT NULL,
    [wallet] [varchar](50) NOT NULL,
    [date] [datetime] NOT NULL,
    [category] [varchar](50) NOT NULL,
    [notes] [varchar](255) NULL,
    [created_at] [datetime] NULL DEFAULT (GETDATE()),
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Transactions_Users] FOREIGN KEY ([user_email]) REFERENCES [dbo].[Users] ([email]) ON DELETE CASCADE
);
GO

-- 6. Create Goals Table
CREATE TABLE [dbo].[Goals](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [user_email] [varchar](100) NOT NULL,
    [title] [varchar](100) NOT NULL,
    [emoji] [varchar](10) NULL DEFAULT ('🎯'),
    [target_amount] [decimal](18, 2) NOT NULL,
    [saved_amount] [decimal](18, 2) NULL DEFAULT (0),
    [deadline] [date] NOT NULL,
    [created_at] [datetime] NULL DEFAULT (GETDATE()),
    PRIMARY KEY CLUSTERED ([id] ASC)
);
GO

-- 7. Create TopupHistory Table
CREATE TABLE [dbo].[TopupHistory](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [user_email] [varchar](100) NOT NULL,
    [external_id] [varchar](100) NOT NULL,
    [amount] [decimal](18, 2) NOT NULL,
    [qr_string] [nvarchar](max) NULL,
    [qr_url] [nvarchar](500) NULL,
    [status] [varchar](20) NULL DEFAULT ('PENDING'),
    [created_at] [datetime] NULL DEFAULT (GETDATE()),
    [paid_at] [datetime] NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_TopupHistory_ExternalId] UNIQUE NONCLUSTERED ([external_id] ASC),
    CONSTRAINT [FK_TopupHistory_Users] FOREIGN KEY ([user_email]) REFERENCES [dbo].[Users] ([email])
);
GO

-- 8. Create BudgetLimits Table
CREATE TABLE [dbo].[BudgetLimits](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [user_email] [varchar](100) NOT NULL,
    [category] [varchar](50) NOT NULL,
    [monthly_limit] [decimal](18, 2) NOT NULL DEFAULT (0),
    [created_at] [datetime] NULL DEFAULT (GETDATE()),
    [updated_at] [datetime] NULL DEFAULT (GETDATE()),
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_BudgetLimit] UNIQUE NONCLUSTERED ([user_email] ASC, [category] ASC),
    CONSTRAINT [FK_BudgetLimits_Users] FOREIGN KEY ([user_email]) REFERENCES [dbo].[Users] ([email])
);
GO
