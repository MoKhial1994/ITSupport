import { CSharpFile } from '../types';

export const csharpSolutionFiles: CSharpFile[] = [
  {
    path: 'SupportToolkit.sln',
    name: 'SupportToolkit.sln',
    language: 'xml',
    content: `Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.8.34330.188
MinimumVisualStudioVersion = 10.0.40219.1
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "SupportToolkit", "SupportToolkit.csproj", "{A8F4C231-8930-4C92-A22D-4E90B01D2E55}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{A8F4C231-8930-4C92-A22D-4E90B01D2E55}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A8F4C231-8930-4C92-A22D-4E90B01D2E55}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A8F4C231-8930-4C92-A22D-4E90B01D2E55}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A8F4C231-8930-4C92-A22D-4E90B01D2E55}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal`
  },
  {
    path: 'SupportToolkit.csproj',
    name: 'SupportToolkit.csproj',
    language: 'xml',
    content: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <UseWPF>true</UseWPF>
    <StartupObject>SupportToolkit.App</StartupObject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
    <PackageReference Include="Dapper" Version="2.1.35" />
    <PackageReference Include="Microsoft.Data.SqlClient" Version="5.2.0" />
    <PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0.0" />
    <PackageReference Include="Serilog" Version="3.1.1" />
    <PackageReference Include="Serilog.Extensions.Hosting" Version="8.0.0" />
    <PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
    <PackageReference Include="System.Management" Version="8.0.0" />
    <PackageReference Include="System.Security.Cryptography.ProtectedData" Version="8.0.0" />
  </ItemGroup>

</Project>`
  },
  {
    path: 'App.xaml',
    name: 'App.xaml',
    language: 'xml',
    content: `<Application x:Class="SupportToolkit.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:local="clr-namespace:SupportToolkit">
    <Application.Resources>
        <BooleanToVisibilityConverter x:Key="BoolToVisibilityConverter"/>
        <local:InverseBoolToVisibilityConverter x:Key="InverseBoolToVisibilityConverter"/>

        <Style x:Key="TitleText" TargetType="TextBlock">
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="FontSize" Value="20"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
        </Style>

        <Style x:Key="LabelText" TargetType="TextBlock">
            <Setter Property="Foreground" Value="#AAAAAA"/>
            <Setter Property="FontSize" Value="11"/>
            <Setter Property="Margin" Value="0,4,0,2"/>
        </Style>

        <Style x:Key="ValueText" TargetType="TextBlock">
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="FontSize" Value="14"/>
            <Setter Property="FontWeight" Value="Medium"/>
        </Style>

        <Style x:Key="CardBorder" TargetType="Border">
            <Setter Property="Background" Value="#2D2D30"/>
            <Setter Property="CornerRadius" Value="6"/>
            <Setter Property="Padding" Value="15"/>
            <Setter Property="Margin" Value="6"/>
        </Style>

        <Style x:Key="PrimaryButton" TargetType="Button">
            <Setter Property="Background" Value="#007ACC"/>
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="Padding" Value="10,6"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>

        <Style x:Key="SecondaryButton" TargetType="Button">
            <Setter Property="Background" Value="#3E3E42"/>
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="Padding" Value="10,6"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>

        <Style x:Key="NavButton" TargetType="Button">
            <Setter Property="Background" Value="Transparent"/>
            <Setter Property="Foreground" Value="#CCCCCC"/>
            <Setter Property="Height" Value="40"/>
            <Setter Property="HorizontalContentAlignment" Value="Left"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>

        <Style x:Key="DarkTextBox" TargetType="TextBox">
            <Setter Property="Background" Value="#252526"/>
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="BorderBrush" Value="#3F3F46"/>
            <Setter Property="Padding" Value="6,4"/>
            <Setter Property="CaretBrush" Value="#FFFFFF"/>
        </Style>

        <Style x:Key="DarkListBox" TargetType="ListBox">
            <Setter Property="Background" Value="#252526"/>
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="BorderBrush" Value="#3F3F46"/>
        </Style>

        <Style x:Key="DarkTreeView" TargetType="TreeView">
            <Setter Property="Background" Value="#252526"/>
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="BorderBrush" Value="#3F3F46"/>
        </Style>

        <Style x:Key="DarkTabControl" TargetType="TabControl">
            <Setter Property="Background" Value="#1E1E1E"/>
            <Setter Property="BorderBrush" Value="#3F3F46"/>
        </Style>

        <Style x:Key="DarkDataGrid" TargetType="DataGrid">
            <Setter Property="Background" Value="#252526"/>
            <Setter Property="RowBackground" Value="#1E1E1E"/>
            <Setter Property="AlternatingRowBackground" Value="#252526"/>
            <Setter Property="Foreground" Value="#FFFFFF"/>
            <Setter Property="GridLinesVisibility" Value="Horizontal"/>
            <Setter Property="HorizontalGridLinesBrush" Value="#333333"/>
            <Setter Property="BorderBrush" Value="#3F3F46"/>
        </Style>
    </Application.Resources>
</Application>`
  },
  {
    path: 'App.xaml.cs',
    name: 'App.xaml.cs',
    language: 'csharp',
    content: `using System;
using System.IO;
using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using SupportToolkit.Core.Interfaces;
using SupportToolkit.Features.DatabaseExplorer.ViewModels;
using SupportToolkit.Features.DeletePlots.ViewModels;
using SupportToolkit.Features.ListFormatter.ViewModels;
using SupportToolkit.Features.SystemInfo.ViewModels;
using SupportToolkit.Services;
using SupportToolkit.ViewModels;
using SupportToolkit.Views;

namespace SupportToolkit
{
    public partial class App : Application
    {
        private readonly IHost _host;

        public App()
        {
            InitializeComponent();

            string appDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "SupportToolkit");
            Directory.CreateDirectory(appDataFolder);

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Debug()
                .WriteTo.File(Path.Combine(appDataFolder, "logs-.txt"), rollingInterval: RollingInterval.Day)
                .CreateLogger();

            _host = Host.CreateDefaultBuilder()
                .UseSerilog()
                .ConfigureServices((context, services) =>
                {
                    services.AddSingleton<INavigationService, NavigationService>();
                    services.AddSingleton<IConnectionStorageService, ConnectionStorageService>();
                    services.AddSingleton<IDatabaseService, SqlServerDatabaseService>();

                    services.AddSingleton<ISupportFeature, DatabaseExplorerViewModel>();
                    services.AddSingleton<ISupportFeature, ListFormatterViewModel>();
                    services.AddSingleton<ISupportFeature, DeletePlotsViewModel>();
                    services.AddSingleton<ISupportFeature, SystemInfoViewModel>();

                    services.AddSingleton<MainWindowViewModel>();
                    services.AddSingleton<MainWindow>();
                })
                .Build();
        }

        protected override async void OnStartup(StartupEventArgs e)
        {
            await _host.StartAsync();
            Log.Information("Support Toolkit application starting up...");

            var mainWindow = _host.Services.GetRequiredService<MainWindow>();
            mainWindow.Show();

            base.OnStartup(e);
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            Log.Information("Support Toolkit application shutting down...");

            using (_host)
            {
                await _host.StopAsync();
            }

            Log.CloseAndFlush();
            base.OnExit(e);
        }
    }
}`
  },
  {
    path: 'InverseBoolToVisibilityConverter.cs',
    name: 'InverseBoolToVisibilityConverter.cs',
    language: 'csharp',
    content: `using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace SupportToolkit
{
    [ValueConversion(typeof(bool), typeof(Visibility))]
    public class InverseBoolToVisibilityConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool b)
            {
                return b ? Visibility.Collapsed : Visibility.Visible;
            }
            return Visibility.Visible;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is Visibility v)
            {
                return v != Visibility.Visible;
            }
            return false;
        }
    }
}`
  },
  {
    path: 'Core/Interfaces/ISupportFeature.cs',
    name: 'ISupportFeature.cs',
    language: 'csharp',
    content: `using System.Threading.Tasks;

namespace SupportToolkit.Core.Interfaces
{
    public interface ISupportFeature
    {
        string Title { get; }
        string Icon { get; }
        Task InitializeAsync();
    }
}`
  },
  {
    path: 'Core/Interfaces/IDatabaseService.cs',
    name: 'IDatabaseService.cs',
    language: 'csharp',
    content: `using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using SupportToolkit.Core.Models;

namespace SupportToolkit.Core.Interfaces
{
    public interface IDatabaseService
    {
        string ProviderName { get; }
        Task<bool> TestConnectionAsync(ConnectionConfig config, CancellationToken cancellationToken = default);
        Task<IEnumerable<DatabaseObject>> GetSchemaTreeAsync(ConnectionConfig config, CancellationToken cancellationToken = default);
        Task<QueryResult> ExecuteQueryAsync(ConnectionConfig config, string sql, CancellationToken cancellationToken = default);
        Task<QueryResult> ExecuteNonQueryAsync(ConnectionConfig config, string sql, CancellationToken cancellationToken = default);
    }
}`
  },
  {
    path: 'Core/Interfaces/INavigationService.cs',
    name: 'INavigationService.cs',
    language: 'csharp',
    content: `using System;
using SupportToolkit.Core.Interfaces;

namespace SupportToolkit.Core.Interfaces
{
    public interface INavigationService
    {
        ISupportFeature? CurrentFeature { get; }
        event Action<ISupportFeature>? CurrentFeatureChanged;
        void NavigateTo(ISupportFeature feature);
    }
}`
  },
  {
    path: 'Core/Interfaces/IConnectionStorageService.cs',
    name: 'IConnectionStorageService.cs',
    language: 'csharp',
    content: `using System.Collections.Generic;
using System.Threading.Tasks;
using SupportToolkit.Core.Models;

namespace SupportToolkit.Core.Interfaces
{
    public interface IConnectionStorageService
    {
        Task<List<ConnectionConfig>> LoadConnectionsAsync();
        Task SaveConnectionsAsync(IEnumerable<ConnectionConfig> connections);
    }
}`
  },
  {
    path: 'Core/Models/ConnectionConfig.cs',
    name: 'ConnectionConfig.cs',
    language: 'csharp',
    content: `using System;
using CommunityToolkit.Mvvm.ComponentModel;

namespace SupportToolkit.Core.Models
{
    public partial class ConnectionConfig : ObservableObject
    {
        [ObservableProperty]
        private Guid _id = Guid.NewGuid();

        [ObservableProperty]
        private string _name = "New Connection";

        [ObservableProperty]
        private string _server = "localhost";

        [ObservableProperty]
        private string _database = "master";

        [ObservableProperty]
        private bool _integratedSecurity = true;

        [ObservableProperty]
        private string _username = string.Empty;

        [ObservableProperty]
        private string _password = string.Empty;

        [ObservableProperty]
        private bool _encrypt = false;

        [ObservableProperty]
        private bool _trustServerCertificate = true;

        [ObservableProperty]
        private int _timeout = 30;

        [ObservableProperty]
        private bool _isDefault = false;

        public ConnectionConfig Clone()
        {
            return new ConnectionConfig
            {
                Id = this.Id,
                Name = this.Name,
                Server = this.Server,
                Database = this.Database,
                IntegratedSecurity = this.IntegratedSecurity,
                Username = this.Username,
                Password = this.Password,
                Encrypt = this.Encrypt,
                TrustServerCertificate = this.TrustServerCertificate,
                Timeout = this.Timeout,
                IsDefault = this.IsDefault
            };
        }
    }
}`
  },
  {
    path: 'Core/Models/ColumnSchemaInfo.cs',
    name: 'ColumnSchemaInfo.cs',
    language: 'csharp',
    content: `namespace SupportToolkit.Core.Models
{
    public class ColumnSchemaInfo
    {
        public string ColumnName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public string MaxLength { get; set; } = string.Empty;
        public bool IsNullable { get; set; }
        public bool IsPrimaryKey { get; set; }
        public bool IsForeignKey { get; set; }
        public bool IsIdentity { get; set; }

        public string DisplayText => 
            string.Format("{0} ({1}{2}, {3}{4}{5}{6})",
                ColumnName,
                DataType,
                string.IsNullOrEmpty(MaxLength) ? "" : "(" + MaxLength + ")",
                IsNullable ? "null" : "not null",
                IsPrimaryKey ? ", PK" : "",
                IsForeignKey ? ", FK" : "",
                IsIdentity ? ", Identity" : "");
    }
}`
  },
  {
    path: 'Core/Models/TableSchemaInfo.cs',
    name: 'TableSchemaInfo.cs',
    language: 'csharp',
    content: `using System.Collections.Generic;

namespace SupportToolkit.Core.Models
{
    public class TableSchemaInfo
    {
        public string SchemaName { get; set; } = "dbo";
        public string TableName { get; set; } = string.Empty;
        public string TableType { get; set; } = "BASE TABLE";
        public List<ColumnSchemaInfo> Columns { get; set; } = new();

        public string FullName => SchemaName + "." + TableName;
    }
}`
  },
  {
    path: 'Core/Models/DatabaseObject.cs',
    name: 'DatabaseObject.cs',
    language: 'csharp',
    content: `using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace SupportToolkit.Core.Models
{
    public enum DatabaseObjectType
    {
        Database,
        Folder,
        Table,
        View,
        StoredProcedure,
        Function,
        Column
    }

    public partial class DatabaseObject : ObservableObject
    {
        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
        private string _details = string.Empty;

        [ObservableProperty]
        private DatabaseObjectType _type;

        [ObservableProperty]
        private ObservableCollection<DatabaseObject> _children = new();

        [ObservableProperty]
        private bool _isExpanded;

        [ObservableProperty]
        private bool _isVisible = true;
    }
}`
  },
  {
    path: 'Core/Models/QueryResult.cs',
    name: 'QueryResult.cs',
    language: 'csharp',
    content: `using System;
using System.Data;

namespace SupportToolkit.Core.Models
{
    public class QueryResult
    {
        public bool IsSuccess { get; set; }
        public DataTable? Data { get; set; }
        public int RowsAffected { get; set; }
        public TimeSpan ExecutionTime { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ErrorDetails { get; set; } = string.Empty;
    }
}`
  },
  {
    path: 'Core/Models/QueryHistoryItem.cs',
    name: 'QueryHistoryItem.cs',
    language: 'csharp',
    content: `using System;

namespace SupportToolkit.Core.Models
{
    public class QueryHistoryItem
    {
        public DateTime ExecutedAt { get; set; } = DateTime.Now;
        public string QueryText { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }
        public TimeSpan Duration { get; set; }
        public int RowsAffected { get; set; }
    }
}`
  },
  {
    path: 'Core/Models/SystemInfoModel.cs',
    name: 'SystemInfoModel.cs',
    language: 'csharp',
    content: `namespace SupportToolkit.Core.Models
{
    public class SystemInfoModel
    {
        public string MachineName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string OsVersion { get; set; } = string.Empty;
        public string DotNetRuntime { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string Processor { get; set; } = string.Empty;
        public string TotalMemory { get; set; } = string.Empty;
    }
}`
  },
  {
    path: 'Services/ConnectionStorageService.cs',
    name: 'ConnectionStorageService.cs',
    language: 'csharp',
    content: `using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SupportToolkit.Core.Interfaces;
using SupportToolkit.Core.Models;

namespace SupportToolkit.Services
{
    public class ConnectionStorageService : IConnectionStorageService
    {
        private readonly ILogger<ConnectionStorageService> _logger;
        private readonly string _filePath;

        public ConnectionStorageService(ILogger<ConnectionStorageService> logger)
        {
            _logger = logger;
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var folder = Path.Combine(appData, "SupportToolkit");
            Directory.CreateDirectory(folder);
            _filePath = Path.Combine(folder, "connections.dat");
        }

        public async Task<List<ConnectionConfig>> LoadConnectionsAsync()
        {
            if (!File.Exists(_filePath))
                return new List<ConnectionConfig>();

            try
            {
                byte[] encryptedData = await File.ReadAllBytesAsync(_filePath);
                if (encryptedData.Length == 0) return new List<ConnectionConfig>();

                byte[] decryptedData = ProtectedData.Unprotect(encryptedData, null, DataProtectionScope.CurrentUser);
                string json = Encoding.UTF8.GetString(decryptedData);

                var list = JsonSerializer.Deserialize<List<ConnectionConfig>>(json);
                return list ?? new List<ConnectionConfig>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load or decrypt stored connections.");
                return new List<ConnectionConfig>();
            }
        }

        public async Task SaveConnectionsAsync(IEnumerable<ConnectionConfig> connections)
        {
            try
            {
                string json = JsonSerializer.Serialize(connections);
                byte[] data = Encoding.UTF8.GetBytes(json);
                byte[] encryptedData = ProtectedData.Protect(data, null, DataProtectionScope.CurrentUser);

                await File.WriteAllBytesAsync(_filePath, encryptedData);
                _logger.LogInformation("Connections encrypted and saved successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to encrypt and save connections.");
                throw;
            }
        }
    }
}`
  },
  {
    path: 'Services/SqlServerDatabaseService.cs',
    name: 'SqlServerDatabaseService.cs',
    language: 'csharp',
    content: `using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using SupportToolkit.Core.Interfaces;
using SupportToolkit.Core.Models;

namespace SupportToolkit.Services
{
    public class SqlServerDatabaseService : IDatabaseService
    {
        private readonly ILogger<SqlServerDatabaseService> _logger;

        public string ProviderName => "SQL Server";

        public SqlServerDatabaseService(ILogger<SqlServerDatabaseService> logger)
        {
            _logger = logger;
        }

        private string BuildConnectionString(ConnectionConfig config)
        {
            var builder = new SqlConnectionStringBuilder
            {
                DataSource = config.Server,
                InitialCatalog = string.IsNullOrWhiteSpace(config.Database) ? "master" : config.Database,
                IntegratedSecurity = config.IntegratedSecurity,
                Encrypt = config.Encrypt,
                TrustServerCertificate = config.TrustServerCertificate,
                ConnectTimeout = config.Timeout
            };

            if (!config.IntegratedSecurity)
            {
                builder.UserID = config.Username;
                builder.Password = config.Password;
            }

            return builder.ConnectionString;
        }

        public async Task<bool> TestConnectionAsync(ConnectionConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                using var connection = new SqlConnection(BuildConnectionString(config));
                await connection.OpenAsync(cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Connection test failed for server {Server}", config.Server);
                return false;
            }
        }

        public async Task<IEnumerable<DatabaseObject>> GetSchemaTreeAsync(ConnectionConfig config, CancellationToken cancellationToken = default)
        {
            var rootNodes = new List<DatabaseObject>();
            var dbNode = new DatabaseObject
            {
                Name = config.Database,
                Type = DatabaseObjectType.Database,
                IsExpanded = true
            };

            var tablesFolder = new DatabaseObject { Name = "Tables", Type = DatabaseObjectType.Folder, IsExpanded = true };
            var viewsFolder = new DatabaseObject { Name = "Views", Type = DatabaseObjectType.Folder };
            var spFolder = new DatabaseObject { Name = "Stored Procedures", Type = DatabaseObjectType.Folder };
            var fnFolder = new DatabaseObject { Name = "Functions", Type = DatabaseObjectType.Folder };

            try
            {
                using var connection = new SqlConnection(BuildConnectionString(config));
                await connection.OpenAsync(cancellationToken);

                const string tablesSql = @"
                    SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE 
                    FROM INFORMATION_SCHEMA.TABLES 
                    ORDER BY TABLE_SCHEMA, TABLE_NAME";

                var tables = await connection.QueryAsync(tablesSql);

                foreach (var tbl in tables)
                {
                    string schema = tbl.TABLE_SCHEMA;
                    string name = tbl.TABLE_NAME;
                    string type = tbl.TABLE_TYPE;

                    var tblObj = new DatabaseObject
                    {
                        Name = schema + "." + name,
                        Type = type == "VIEW" ? DatabaseObjectType.View : DatabaseObjectType.Table
                    };

                    if (type == "VIEW") viewsFolder.Children.Add(tblObj);
                    else tablesFolder.Children.Add(tblObj);
                }

                dbNode.Children.Add(tablesFolder);
                dbNode.Children.Add(viewsFolder);
                dbNode.Children.Add(spFolder);
                dbNode.Children.Add(fnFolder);
                rootNodes.Add(dbNode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load database schema for {Database}", config.Database);
            }

            return rootNodes;
        }

        public async Task<QueryResult> ExecuteQueryAsync(ConnectionConfig config, string sql, CancellationToken cancellationToken = default)
        {
            var result = new QueryResult();
            var sw = Stopwatch.StartNew();

            try
            {
                using var connection = new SqlConnection(BuildConnectionString(config));
                await connection.OpenAsync(cancellationToken);

                using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.CommandTimeout = config.Timeout;

                using var reader = await command.ExecuteReaderAsync(cancellationToken);
                var dt = new DataTable();
                dt.Load(reader);

                sw.Stop();
                result.IsSuccess = true;
                result.Data = dt;
                result.RowsAffected = dt.Rows.Count;
                result.ExecutionTime = sw.Elapsed;
                result.Message = string.Format("Query executed successfully. {0} row(s) returned.", dt.Rows.Count);
            }
            catch (Exception ex)
            {
                sw.Stop();
                result.IsSuccess = false;
                result.ExecutionTime = sw.Elapsed;
                result.Message = "Error executing query.";
                result.ErrorDetails = ex.Message;
            }

            return result;
        }

        public async Task<QueryResult> ExecuteNonQueryAsync(ConnectionConfig config, string sql, CancellationToken cancellationToken = default)
        {
            var result = new QueryResult();
            var sw = Stopwatch.StartNew();

            try
            {
                using var connection = new SqlConnection(BuildConnectionString(config));
                await connection.OpenAsync(cancellationToken);

                using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.CommandTimeout = config.Timeout;

                int rows = await command.ExecuteNonQueryAsync(cancellationToken);

                sw.Stop();
                result.IsSuccess = true;
                result.RowsAffected = rows;
                result.ExecutionTime = sw.Elapsed;
                result.Message = string.Format("Command executed successfully. {0} row(s) affected.", rows);
            }
            catch (Exception ex)
            {
                sw.Stop();
                result.IsSuccess = false;
                result.ExecutionTime = sw.Elapsed;
                result.Message = "Error executing command.";
                result.ErrorDetails = ex.Message;
            }

            return result;
        }
    }
}`
  },
  {
    path: 'Services/NavigationService.cs',
    name: 'NavigationService.cs',
    language: 'csharp',
    content: `using System;
using SupportToolkit.Core.Interfaces;

namespace SupportToolkit.Services
{
    public class NavigationService : INavigationService
    {
        private ISupportFeature? _currentFeature;

        public ISupportFeature? CurrentFeature
        {
            get => _currentFeature;
            private set
            {
                if (_currentFeature != value)
                {
                    _currentFeature = value;
                    CurrentFeatureChanged?.Invoke(_currentFeature);
                }
            }
        }

        public event Action<ISupportFeature>? CurrentFeatureChanged;

        public void NavigateTo(ISupportFeature feature)
        {
            CurrentFeature = feature;
            _ = feature.InitializeAsync();
        }
    }
}`
  },
  {
    path: 'Features/DatabaseExplorer/ViewModels/DatabaseExplorerViewModel.cs',
    name: 'DatabaseExplorerViewModel.cs',
    language: 'csharp',
    content: `using System;
using System.Collections.ObjectModel;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using SupportToolkit.Core.Interfaces;
using SupportToolkit.Core.Models;

namespace SupportToolkit.Features.DatabaseExplorer.ViewModels
{
    public partial class DatabaseExplorerViewModel : ObservableObject, ISupportFeature
    {
        private readonly IDatabaseService _databaseService;
        private readonly IConnectionStorageService _storageService;
        private readonly ILogger<DatabaseExplorerViewModel> _logger;
        private CancellationTokenSource? _queryCts;

        public string Title => "Database Explorer";
        public string Icon => "🗄️";

        [ObservableProperty]
        private ObservableCollection<ConnectionConfig> _savedConnections = new();

        [ObservableProperty]
        private ConnectionConfig? _selectedConnection;

        [ObservableProperty]
        private ConnectionConfig _editingConnection = new();

        [ObservableProperty]
        private ObservableCollection<DatabaseObject> _schemaTree = new();

        [ObservableProperty]
        private string _schemaFilterText = string.Empty;

        [ObservableProperty]
        private string _sqlQuery = "SELECT TOP 100 * FROM sys.tables;";

        [ObservableProperty]
        private QueryResult? _lastQueryResult;

        [ObservableProperty]
        private DataTable? _queryResultTable;

        [ObservableProperty]
        private bool _isExecuting;

        [ObservableProperty]
        private string _statusMessage = "Ready";

        [ObservableProperty]
        private ObservableCollection<QueryHistoryItem> _queryHistory = new();

        [ObservableProperty]
        private QueryHistoryItem? _selectedHistoryItem;

        public DatabaseExplorerViewModel(
            IDatabaseService databaseService, 
            IConnectionStorageService storageService,
            ILogger<DatabaseExplorerViewModel> logger)
        {
            _databaseService = databaseService;
            _storageService = storageService;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            var connections = await _storageService.LoadConnectionsAsync();
            SavedConnections.Clear();
            foreach (var conn in connections)
            {
                SavedConnections.Add(conn);
            }

            if (SavedConnections.Any())
            {
                SelectedConnection = SavedConnections.FirstOrDefault(c => c.IsDefault) ?? SavedConnections.First();
            }
            else
            {
                CreateNewConnection();
            }
        }

        partial void OnSelectedConnectionChanged(ConnectionConfig? value)
        {
            if (value != null)
            {
                EditingConnection = value.Clone();
                _ = RefreshSchemaAsync();
            }
        }

        partial void OnSelectedHistoryItemChanged(QueryHistoryItem? value)
        {
            if (value != null)
            {
                SqlQuery = value.QueryText;
            }
        }

        partial void OnSchemaFilterTextChanged(string value)
        {
            FilterSchemaTree(SchemaTree, value);
        }

        private bool FilterSchemaTree(ObservableCollection<DatabaseObject> nodes, string filter)
        {
            bool anyChildVisible = false;
            foreach (var node in nodes)
            {
                bool matches = string.IsNullOrWhiteSpace(filter) || 
                               node.Name.Contains(filter, StringComparison.OrdinalIgnoreCase) || 
                               node.Details.Contains(filter, StringComparison.OrdinalIgnoreCase);

                bool childMatches = FilterSchemaTree(node.Children, filter);
                node.IsVisible = matches || childMatches;

                if (node.IsVisible) anyChildVisible = true;
            }
            return anyChildVisible;
        }

        [RelayCommand]
        public void CreateNewConnection()
        {
            SelectedConnection = null;
            EditingConnection = new ConnectionConfig { Name = "New SQL Connection" };
        }

        [RelayCommand]
        public async Task SaveConnectionAsync()
        {
            var existing = SavedConnections.FirstOrDefault(c => c.Id == EditingConnection.Id);
            if (existing != null)
            {
                int index = SavedConnections.IndexOf(existing);
                SavedConnections[index] = EditingConnection.Clone();
            }
            else
            {
                SavedConnections.Add(EditingConnection.Clone());
            }

            if (EditingConnection.IsDefault)
            {
                foreach (var c in SavedConnections)
                {
                    if (c.Id != EditingConnection.Id) c.IsDefault = false;
                }
            }

            await _storageService.SaveConnectionsAsync(SavedConnections);
            SelectedConnection = SavedConnections.FirstOrDefault(c => c.Id == EditingConnection.Id);
            StatusMessage = "Connection details saved successfully.";
        }

        [RelayCommand]
        public async Task DeleteConnectionAsync()
        {
            if (SelectedConnection == null) return;

            SavedConnections.Remove(SelectedConnection);
            await _storageService.SaveConnectionsAsync(SavedConnections);
            CreateNewConnection();
            StatusMessage = "Connection removed.";
        }

        [RelayCommand]
        public async Task TestConnectionAsync()
        {
            StatusMessage = "Testing connection...";
            bool success = await _databaseService.TestConnectionAsync(EditingConnection);
            StatusMessage = success ? "Connection successful!" : "Connection failed. Check credentials and server.";
        }

        [RelayCommand]
        public async Task RefreshSchemaAsync()
        {
            if (SelectedConnection == null) return;

            StatusMessage = "Loading database schema...";
            var tree = await _databaseService.GetSchemaTreeAsync(SelectedConnection);
            SchemaTree.Clear();
            foreach (var node in tree)
            {
                SchemaTree.Add(node);
            }
            FilterSchemaTree(SchemaTree, SchemaFilterText);
            StatusMessage = "Schema refreshed successfully.";
        }

        [RelayCommand]
        public async Task ExecuteQueryAsync()
        {
            if (SelectedConnection == null || string.IsNullOrWhiteSpace(SqlQuery)) return;

            IsExecuting = true;
            StatusMessage = "Executing query...";
            _queryCts = new CancellationTokenSource();

            try
            {
                string trimmedSql = SqlQuery.Trim();
                bool isSelect = trimmedSql.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase) ||
                                trimmedSql.StartsWith("WITH", StringComparison.OrdinalIgnoreCase) ||
                                trimmedSql.StartsWith("EXEC", StringComparison.OrdinalIgnoreCase);

                QueryResult result;
                if (isSelect)
                {
                    result = await _databaseService.ExecuteQueryAsync(SelectedConnection, SqlQuery, _queryCts.Token);
                    QueryResultTable = result.Data;
                }
                else
                {
                    result = await _databaseService.ExecuteNonQueryAsync(SelectedConnection, SqlQuery, _queryCts.Token);
                    QueryResultTable = null;
                }

                LastQueryResult = result;
                StatusMessage = result.IsSuccess 
                    ? string.Format("{0} (Duration: {1:F0} ms)", result.Message, result.ExecutionTime.TotalMilliseconds)
                    : "Error: " + result.ErrorDetails;

                QueryHistory.Insert(0, new QueryHistoryItem
                {
                    QueryText = SqlQuery,
                    IsSuccess = result.IsSuccess,
                    Duration = result.ExecutionTime,
                    RowsAffected = result.RowsAffected
                });
            }
            catch (OperationCanceledException)
            {
                StatusMessage = "Query execution cancelled by user.";
            }
            catch (Exception ex)
            {
                StatusMessage = "Execution error: " + ex.Message;
            }
            finally
            {
                IsExecuting = false;
                _queryCts.Dispose();
                _queryCts = null;
            }
        }

        [RelayCommand]
        public void CancelQuery()
        {
            _queryCts?.Cancel();
        }

        [RelayCommand]
        public void ClearQuery()
        {
            SqlQuery = string.Empty;
        }

        [RelayCommand]
        public void ExportCsv()
        {
            if (QueryResultTable == null || QueryResultTable.Rows.Count == 0)
            {
                MessageBox.Show("No data available to export.", "Export CSV", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            var dialog = new Microsoft.Win32.SaveFileDialog
            {
                Filter = "CSV File (*.csv)|*.csv",
                FileName = "Export_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".csv"
            };

            if (dialog.ShowDialog() == true)
            {
                var sb = new StringBuilder();

                var headers = new List<string>();
                foreach (DataColumn col in QueryResultTable.Columns)
                {
                    headers.Add(EscapeCsvField(col.ColumnName));
                }
                sb.AppendLine(string.Join(",", headers));

                foreach (DataRow row in QueryResultTable.Rows)
                {
                    var fields = new List<string>();
                    foreach (object item in row.ItemArray)
                    {
                        fields.Add(EscapeCsvField(item?.ToString()));
                    }
                    sb.AppendLine(string.Join(",", fields));
                }

                File.WriteAllText(dialog.FileName, sb.ToString(), Encoding.UTF8);
                MessageBox.Show("CSV Export completed successfully!", "Export CSV", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private static string EscapeCsvField(string value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
    }
}`
  },
  {
    path: 'Features/DatabaseExplorer/Views/DatabaseExplorerView.xaml',
    name: 'DatabaseExplorerView.xaml',
    language: 'xml',
    content: `<UserControl x:Class="SupportToolkit.Features.DatabaseExplorer.Views.DatabaseExplorerView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             xmlns:models="clr-namespace:SupportToolkit.Core.Models"
             xmlns:local="clr-namespace:SupportToolkit"
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="1000">
    <Grid Margin="10">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="280"/>
            <ColumnDefinition Width="5"/>
            <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

        <TabControl Grid.Column="0" Style="{StaticResource DarkTabControl}">
            <TabItem Header="Connections">
                <Grid Margin="5">
                    <Grid.RowDefinitions>
                        <RowDefinition Height="Auto"/>
                        <RowDefinition Height="120"/>
                        <RowDefinition Height="*"/>
                    </Grid.RowDefinitions>

                    <Button Grid.Row="0" Content="+ New Connection" Command="{Binding CreateNewConnectionCommand}" Style="{StaticResource PrimaryButton}" Margin="0,0,0,5"/>

                    <ListBox Grid.Row="1" ItemsSource="{Binding SavedConnections}" SelectedItem="{Binding SelectedConnection}" DisplayMemberPath="Name" Style="{StaticResource DarkListBox}"/>

                    <ScrollViewer Grid.Row="2" VerticalScrollBarVisibility="Auto" Margin="0,10,0,0">
                        <StackPanel>
                            <TextBlock Text="Display Name" Style="{StaticResource LabelText}"/>
                            <TextBox Text="{Binding EditingConnection.Name, UpdateSourceTrigger=PropertyChanged}" Style="{StaticResource DarkTextBox}"/>

                            <TextBlock Text="Server Address" Style="{StaticResource LabelText}"/>
                            <TextBox Text="{Binding EditingConnection.Server, UpdateSourceTrigger=PropertyChanged}" Style="{StaticResource DarkTextBox}"/>

                            <TextBlock Text="Database Name" Style="{StaticResource LabelText}"/>
                            <TextBox Text="{Binding EditingConnection.Database, UpdateSourceTrigger=PropertyChanged}" Style="{StaticResource DarkTextBox}"/>

                            <CheckBox Content="Windows Authentication" IsChecked="{Binding EditingConnection.IntegratedSecurity}" Foreground="#DCDCDC" Margin="0,8,0,8"/>

                            <StackPanel Visibility="{Binding EditingConnection.IntegratedSecurity, Converter={StaticResource InverseBoolToVisibilityConverter}}">
                                <TextBlock Text="Username" Style="{StaticResource LabelText}"/>
                                <TextBox Text="{Binding EditingConnection.Username, UpdateSourceTrigger=PropertyChanged}" Style="{StaticResource DarkTextBox}"/>

                                <TextBlock Text="Password" Style="{StaticResource LabelText}"/>
                                <TextBox Text="{Binding EditingConnection.Password, UpdateSourceTrigger=PropertyChanged}" Style="{StaticResource DarkTextBox}"/>
                            </StackPanel>

                            <CheckBox Content="Trust Server Certificate" IsChecked="{Binding EditingConnection.TrustServerCertificate}" Foreground="#DCDCDC" Margin="0,8,0,8"/>
                            <CheckBox Content="Set as Default Connection" IsChecked="{Binding EditingConnection.IsDefault}" Foreground="#DCDCDC" Margin="0,0,0,12"/>

                            <UniformGrid Columns="2" Margin="0,5,0,0">
                                <Button Content="Test" Command="{Binding TestConnectionCommand}" Style="{StaticResource SecondaryButton}" Margin="0,0,2,0"/>
                                <Button Content="Save" Command="{Binding SaveConnectionCommand}" Style="{StaticResource PrimaryButton}" Margin="2,0,0,0"/>
                            </UniformGrid>
                            <Button Content="Delete Connection" Command="{Binding DeleteConnectionCommand}" Style="{StaticResource SecondaryButton}" Margin="0,5,0,0"/>
                        </StackPanel>
                    </ScrollViewer>
                </Grid>
            </TabItem>

            <TabItem Header="Schema">
                <Grid Margin="5">
                    <Grid.RowDefinitions>
                        <RowDefinition Height="Auto"/>
                        <RowDefinition Height="Auto"/>
                        <RowDefinition Height="*"/>
                    </Grid.RowDefinitions>

                    <Button Grid.Row="0" Content="🔄 Refresh Schema" Command="{Binding RefreshSchemaCommand}" Style="{StaticResource SecondaryButton}" Margin="0,0,0,5"/>
                    <TextBox Grid.Row="1" Text="{Binding SchemaFilterText, UpdateSourceTrigger=PropertyChanged}" Style="{StaticResource DarkTextBox}" Margin="0,0,0,5"/>

                    <TreeView Grid.Row="2" ItemsSource="{Binding SchemaTree}" Style="{StaticResource DarkTreeView}">
                        <TreeView.ItemContainerStyle>
                            <Style TargetType="TreeViewItem">
                                <Setter Property="IsExpanded" Value="{Binding IsExpanded, Mode=TwoWay}"/>
                                <Setter Property="Visibility" Value="{Binding IsVisible, Converter={StaticResource BoolToVisibilityConverter}}"/>
                                <Setter Property="Foreground" Value="#E0E0E0"/>
                            </Style>
                        </TreeView.ItemContainerStyle>
                        <TreeView.ItemTemplate>
                            <HierarchicalDataTemplate ItemsSource="{Binding Children}">
                                <StackPanel Orientation="Horizontal" Margin="2">
                                    <TextBlock Text="{Binding Name}" FontWeight="Medium" Foreground="#FFFFFF"/>
                                    <TextBlock Text="{Binding Details}" Foreground="#888888" Margin="8,0,0,0" FontStyle="Italic"/>
                                </StackPanel>
                            </HierarchicalDataTemplate>
                        </TreeView.ItemTemplate>
                    </TreeView>
                </Grid>
            </TabItem>
        </TabControl>

        <GridSplitter Grid.Column="1" Width="5" HorizontalAlignment="Stretch" Background="#333333"/>

        <Grid Grid.Column="2" Margin="5,0,0,0">
            <Grid.RowDefinitions>
                <RowDefinition Height="2*"/>
                <RowDefinition Height="5"/>
                <RowDefinition Height="3*"/>
            </Grid.RowDefinitions>

            <Grid Grid.Row="0">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                </Grid.RowDefinitions>

                <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="0,0,0,5">
                    <Button Content="▶ Execute" Command="{Binding ExecuteQueryCommand}" Style="{StaticResource PrimaryButton}" Width="90" Margin="0,0,5,0"/>
                    <Button Content="⏹ Cancel" Command="{Binding CancelQueryCommand}" Style="{StaticResource SecondaryButton}" Width="80" Margin="0,0,5,0"/>
                    <Button Content="🗑 Clear" Command="{Binding ClearQueryCommand}" Style="{StaticResource SecondaryButton}" Width="80" Margin="0,0,5,0"/>
                    <Button Content="📊 Export CSV" Command="{Binding ExportCsvCommand}" Style="{StaticResource SecondaryButton}" Width="90"/>
                </StackPanel>

                <TextBox Grid.Row="1" Text="{Binding SqlQuery, UpdateSourceTrigger=PropertyChanged}" 
                         AcceptsReturn="True" AcceptsTab="True" 
                         FontFamily="Consolas" FontSize="14"
                         VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Auto"
                         Style="{StaticResource DarkTextBox}"/>
            </Grid>

            <GridSplitter Grid.Row="1" Height="5" HorizontalAlignment="Stretch" Background="#333333"/>

            <TabControl Grid.Row="2" Style="{StaticResource DarkTabControl}">
                <TabItem Header="Results DataGrid">
                    <Grid>
                        <DataGrid ItemsSource="{Binding QueryResultTable}" AutoGenerateColumns="True" IsReadOnly="True" Style="{StaticResource DarkDataGrid}"/>
                        <TextBlock Text="{Binding LastQueryResult.ErrorDetails}" Foreground="#FF6B6B" Margin="10" TextWrapping="Wrap" VerticalAlignment="Top"
                                   Visibility="{Binding LastQueryResult.IsSuccess, Converter={StaticResource InverseBoolToVisibilityConverter}}"/>
                    </Grid>
                </TabItem>

                <TabItem Header="Query History">
                    <ListBox ItemsSource="{Binding QueryHistory}" SelectedItem="{Binding SelectedHistoryItem}" Style="{StaticResource DarkListBox}">
                        <ListBox.ItemTemplate>
                            <DataTemplate>
                                <Grid Margin="4">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="140"/>
                                        <ColumnDefinition Width="80"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <TextBlock Grid.Column="0" Text="{Binding ExecutedAt, StringFormat='yyyy-MM-dd HH:mm:ss'}" Foreground="#888888"/>
                                    <TextBlock Grid.Column="1" Text="{Binding Duration.TotalMilliseconds, StringFormat='{}{0:F0} ms'}" Foreground="#4CAF50"/>
                                    <TextBlock Grid.Column="2" Text="{Binding QueryText}" TextTrimming="CharacterEllipsis" Foreground="#FFFFFF"/>
                                </Grid>
                            </DataTemplate>
                        </ListBox.ItemTemplate>
                    </ListBox>
                </TabItem>
                </TabControl>
        </Grid>
    </Grid>
</UserControl>`
  },
  {
    path: 'Features/DatabaseExplorer/Views/DatabaseExplorerView.xaml.cs',
    name: 'DatabaseExplorerView.xaml.cs',
    language: 'csharp',
    content: `using System.Windows.Controls;

namespace SupportToolkit.Features.DatabaseExplorer.Views
{
    public partial class DatabaseExplorerView : UserControl
    {
        public DatabaseExplorerView()
        {
            InitializeComponent();
        }
    }
}`
  },
  {
    path: 'Features/SystemInfo/ViewModels/SystemInfoViewModel.cs',
    name: 'SystemInfoViewModel.cs',
    language: 'csharp',
    content: `using System;
using System.Linq;
using System.Management;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SupportToolkit.Core.Interfaces;
using SupportToolkit.Core.Models;

namespace SupportToolkit.Features.SystemInfo.ViewModels
{
    public partial class SystemInfoViewModel : ObservableObject, ISupportFeature
    {
        public string Title => "System Information";
        public string Icon => "💻";

        [ObservableProperty]
        private SystemInfoModel _info = new();

        [ObservableProperty]
        private bool _isLoading;

        public async Task InitializeAsync()
        {
            await RefreshSystemInfoAsync();
        }

        [RelayCommand]
        public async Task RefreshSystemInfoAsync()
        {
            IsLoading = true;

            await Task.Run(() =>
            {
                var sysInfo = new SystemInfoModel
                {
                    MachineName = Environment.MachineName,
                    UserName = Environment.UserName,
                    OsVersion = RuntimeInformation.OSDescription,
                    DotNetRuntime = RuntimeInformation.FrameworkDescription,
                    IpAddress = GetLocalIpAddress(),
                    Processor = GetProcessorName(),
                    TotalMemory = GetTotalMemory()
                };

                Info = sysInfo;
            });

            IsLoading = false;
        }

        private string GetLocalIpAddress()
        {
            try
            {
                var host = Dns.GetHostEntry(Dns.GetHostName());
                var ip = host.AddressList.FirstOrDefault(a => a.AddressFamily == AddressFamily.InterNetwork);
                return ip?.ToString() ?? "127.0.0.1";
            }
            catch
            {
                return "Unavailable";
            }
        }

        private string GetProcessorName()
        {
            try
            {
                using var searcher = new ManagementObjectSearcher("select Name from Win32_Processor");
                foreach (var item in searcher.Get())
                {
                    return item["Name"]?.ToString()?.Trim() ?? "Unknown";
                }
            }
            catch
            {
            }
            return Environment.ProcessorCount + " Cores (Logical)";
        }

        private string GetTotalMemory()
        {
            try
            {
                using var searcher = new ManagementObjectSearcher("select TotalPhysicalMemory from Win32_ComputerSystem");
                foreach (var item in searcher.Get())
                {
                    if (ulong.TryParse(item["TotalPhysicalMemory"]?.ToString(), out ulong bytes))
                    {
                        double gb = bytes / (1024.0 * 1024.0 * 1024.0);
                        return string.Format("{0:F2} GB", gb);
                    }
                }
            }
            catch
            {
            }
            return "Unknown";
        }
    }
}`
  },
  {
    path: 'Features/SystemInfo/Views/SystemInfoView.xaml',
    name: 'SystemInfoView.xaml',
    language: 'xml',
    content: `<UserControl x:Class="SupportToolkit.Features.SystemInfo.Views.SystemInfoView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="600" d:DesignWidth="800">
    <Grid Margin="20">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="0,0,0,20">
            <TextBlock Text="System Diagnostic Overview" Style="{StaticResource TitleText}"/>
            <Button Content="🔄 Refresh" Command="{Binding RefreshSystemInfoCommand}" Style="{StaticResource SecondaryButton}" Margin="20,0,0,0" Width="100" Height="32"/>
        </StackPanel>

        <ScrollViewer Grid.Row="1" VerticalScrollBarVisibility="Auto">
            <UniformGrid Columns="2" VerticalAlignment="Top">
                <Border Style="{StaticResource CardBorder}">
                    <StackPanel>
                        <TextBlock Text="Machine Name" Style="{StaticResource LabelText}"/>
                        <TextBlock Text="{Binding Info.MachineName}" Style="{StaticResource ValueText}"/>
                    </StackPanel>
                </Border>

                <Border Style="{StaticResource CardBorder}">
                    <StackPanel>
                        <TextBlock Text="Current User" Style="{StaticResource LabelText}"/>
                        <TextBlock Text="{Binding Info.UserName}" Style="{StaticResource ValueText}"/>
                    </StackPanel>
                </Border>

                <Border Style="{StaticResource CardBorder}">
                    <StackPanel>
                        <TextBlock Text="Operating System" Style="{StaticResource LabelText}"/>
                        <TextBlock Text="{Binding Info.OsVersion}" Style="{StaticResource ValueText}"/>
                    </StackPanel>
                </Border>

                <Border Style="{StaticResource CardBorder}">
                    <StackPanel>
                        <TextBlock Text=".NET Runtime Environment" Style="{StaticResource LabelText}"/>
                        <TextBlock Text="{Binding Info.DotNetRuntime}" Style="{StaticResource ValueText}"/>
                    </StackPanel>
                </Border>

                <Border Style="{StaticResource CardBorder}">
                    <StackPanel>
                        <TextBlock Text="Local IP Address" Style="{StaticResource LabelText}"/>
                        <TextBlock Text="{Binding Info.IpAddress}" Style="{StaticResource ValueText}"/>
                    </StackPanel>
                </Border>

                <Border Style="{StaticResource CardBorder}">
                    <StackPanel>
                        <TextBlock Text="Processor / CPU" Style="{StaticResource LabelText}"/>
                        <TextBlock Text="{Binding Info.Processor}" Style="{StaticResource ValueText}"/>
                    </StackPanel>
                </Border>

                <Border Style="{StaticResource CardBorder}">
                    <StackPanel>
                        <TextBlock Text="Total System RAM" Style="{StaticResource LabelText}"/>
                        <TextBlock Text="{Binding Info.TotalMemory}" Style="{StaticResource ValueText}"/>
                    </StackPanel>
                </Border>
            </UniformGrid>
        </ScrollViewer>
    </Grid>
</UserControl>`
  },
  {
    path: 'Features/SystemInfo/Views/SystemInfoView.xaml.cs',
    name: 'SystemInfoView.xaml.cs',
    language: 'csharp',
    content: `using System.Windows.Controls;

namespace SupportToolkit.Features.SystemInfo.Views
{
    public partial class SystemInfoView : UserControl
    {
        public SystemInfoView()
        {
            InitializeComponent();
        }
    }
}`
  },
  {
    path: 'Features/ListFormatter/ViewModels/ListFormatterViewModel.cs',
    name: 'ListFormatterViewModel.cs',
    language: 'csharp',
    content: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SupportToolkit.Core.Interfaces;

namespace SupportToolkit.Features.ListFormatter.ViewModels
{
    public partial class ListFormatterViewModel : ObservableObject, ISupportFeature
    {
        public string Title => "List & SQL Formatter";
        public string Icon => "💬";

        [ObservableProperty]
        private string _rawInput = "ORD-2026-8801\\nORD-2026-8802\\nORD-2026-8803\\nORD-2026-8804\\nORD-2026-8802\\nORD-2026-8805";

        [ObservableProperty]
        private string _formattedOutput = string.Empty;

        [ObservableProperty]
        private bool _useSingleQuotes = true;

        [ObservableProperty]
        private bool _useCommaSeparator = true;

        [ObservableProperty]
        private bool _useSqlInClause = false;

        [ObservableProperty]
        private bool _trimWhitespace = true;

        [ObservableProperty]
        private bool _removeDuplicates = true;

        [ObservableProperty]
        private bool _ignoreEmptyLines = true;

        [ObservableProperty]
        private int _totalRawCount;

        [ObservableProperty]
        private int _processedCount;

        [ObservableProperty]
        private int _duplicateCount;

        public Task InitializeAsync()
        {
            FormatList();
            return Task.CompletedTask;
        }

        partial void OnRawInputChanged(string value) => FormatList();
        partial void OnUseSingleQuotesChanged(bool value) => FormatList();
        partial void OnUseCommaSeparatorChanged(bool value) => FormatList();
        partial void OnUseSqlInClauseChanged(bool value) => FormatList();
        partial void OnTrimWhitespaceChanged(bool value) => FormatList();
        partial void OnRemoveDuplicatesChanged(bool value) => FormatList();
        partial void OnIgnoreEmptyLinesChanged(bool value) => FormatList();

        [RelayCommand]
        public void FormatList()
        {
            if (string.IsNullOrWhiteSpace(RawInput))
            {
                FormattedOutput = string.Empty;
                TotalRawCount = 0;
                ProcessedCount = 0;
                DuplicateCount = 0;
                return;
            }

            var rawItems = RawInput.Split(new[] { '\\r', '\\n', ',', ';', '\\t' }, StringSplitOptions.None)
                .Select(x => TrimWhitespace ? x.Trim() : x)
                .ToList();

            TotalRawCount = rawItems.Count;

            var filteredItems = rawItems.Where(x => !IgnoreEmptyLines || !string.IsNullOrEmpty(x)).ToList();

            DuplicateCount = 0;
            if (RemoveDuplicates)
            {
                var unique = new List<string>();
                var seen = new HashSet<string>();
                foreach (var item in filteredItems)
                {
                    if (seen.Contains(item))
                    {
                        DuplicateCount++;
                    }
                    else
                    {
                        seen.Add(item);
                        unique.Add(item);
                    }
                }
                filteredItems = unique;
            }

            ProcessedCount = filteredItems.Count;

            var quotedItems = filteredItems.Select(x => UseSingleQuotes ? string.Format("'{0}'", x) : x);

            string delimiter = UseCommaSeparator ? ", " : "\\n";
            string joined = string.Join(delimiter, quotedItems);

            if (UseSqlInClause)
            {
                joined = string.Format("IN ({0})", joined);
            }

            FormattedOutput = joined;
        }

        [RelayCommand]
        public void CopyToClipboard()
        {
            if (!string.IsNullOrEmpty(FormattedOutput))
            {
                Clipboard.SetText(FormattedOutput);
            }
        }

        [RelayCommand]
        public void Clear()
        {
            RawInput = string.Empty;
        }
    }
}`
  },
  {
    path: 'Features/ListFormatter/Views/ListFormatterView.xaml',
    name: 'ListFormatterView.xaml',
    language: 'xml',
    content: `<UserControl x:Class="SupportToolkit.Features.ListFormatter.Views.ListFormatterView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="1000">
    <Grid Margin="10">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="*"/>
            <ColumnDefinition Width="280"/>
            <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

        <Border Grid.Column="0" Background="#252526" CornerRadius="4" Padding="10" Margin="0,0,5,0">
            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <TextBlock Text="Raw Input List" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,8"/>
                <TextBox Grid.Row="1" Text="{Binding RawInput, UpdateSourceTrigger=PropertyChanged}"
                         AcceptsReturn="True" TextWrapping="Wrap"
                         Background="#1E1E1E" Foreground="#E0E0E0" FontFamily="Consolas"
                         Padding="8" BorderBrush="#3F3F46"/>
                <Button Grid.Row="2" Content="Clear" Command="{Binding ClearCommand}" Style="{StaticResource SecondaryButton}" Margin="0,8,0,0"/>
            </Grid>
        </Border>

        <Border Grid.Column="1" Background="#252526" CornerRadius="4" Padding="12" Margin="5,0,5,0">
            <StackPanel>
                <TextBlock Text="Format Options" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,12"/>
                
                <CheckBox Content="Single Quote ('item')" IsChecked="{Binding UseSingleQuotes}" Foreground="#E0E0E0" Margin="0,4"/>
                <CheckBox Content="Comma Separated (,)" IsChecked="{Binding UseCommaSeparator}" Foreground="#E0E0E0" Margin="0,4"/>
                <CheckBox Content="Wrap SQL IN (...)" IsChecked="{Binding UseSqlInClause}" Foreground="#E0E0E0" Margin="0,4"/>

                <Separator Background="#3F3F46" Margin="0,12"/>

                <TextBlock Text="Cleaning Filters" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,8"/>
                <CheckBox Content="Trim Whitespace" IsChecked="{Binding TrimWhitespace}" Foreground="#E0E0E0" Margin="0,4"/>
                <CheckBox Content="Remove Duplicates" IsChecked="{Binding RemoveDuplicates}" Foreground="#E0E0E0" Margin="0,4"/>
                <CheckBox Content="Ignore Empty Lines" IsChecked="{Binding IgnoreEmptyLines}" Foreground="#E0E0E0" Margin="0,4"/>

                <Separator Background="#3F3F46" Margin="0,12"/>

                <TextBlock Text="{Binding ProcessedCount, StringFormat='Processed Items: {0}'}" Foreground="#007ACC" FontWeight="Bold"/>
                <TextBlock Text="{Binding DuplicateCount, StringFormat='Duplicates Removed: {0}'}" Foreground="#FFC107" Margin="0,4,0,0"/>
            </StackPanel>
        </Border>

        <Border Grid.Column="2" Background="#252526" CornerRadius="4" Padding="10" Margin="5,0,0,0">
            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <TextBlock Text="Formatted Result" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,8"/>
                <TextBox Grid.Row="1" Text="{Binding FormattedOutput, Mode=OneWay}" IsReadOnly="True"
                         AcceptsReturn="True" TextWrapping="Wrap"
                         Background="#1E1E1E" Foreground="#4EC9B0" FontFamily="Consolas"
                         Padding="8" BorderBrush="#3F3F46"/>
                <Button Grid.Row="2" Content="Copy to Clipboard" Command="{Binding CopyToClipboardCommand}"
                        Style="{StaticResource PrimaryButton}" Margin="0,8,0,0"/>
            </Grid>
        </Border>
    </Grid>
</UserControl>`
  },
  {
    path: 'Features/ListFormatter/Views/ListFormatterView.xaml.cs',
    name: 'ListFormatterView.xaml.cs',
    language: 'csharp',
    content: `using System.Windows.Controls;

namespace SupportToolkit.Features.ListFormatter.Views
{
    public partial class ListFormatterView : UserControl
    {
        public ListFormatterView()
        {
            InitializeComponent();
        }
    }
}`
  },
  {
    path: 'Features/DeletePlots/ViewModels/DeletePlotsViewModel.cs',
    name: 'DeletePlotsViewModel.cs',
    language: 'csharp',
    content: `using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SupportToolkit.Core.Interfaces;

namespace SupportToolkit.Features.DeletePlots.ViewModels
{
    public partial class DeletePlotsViewModel : ObservableObject, ISupportFeature
    {
        public string Title => "Delete Plots Generator";
        public string Icon => "🗑️";

        [ObservableProperty]
        private string _rawInput = "InspectionPlanId\tQuestionInspectionId\n96991\t9808165\n96991\t9808166\n96992\t9808167";

        [ObservableProperty]
        private string _generatedSql = string.Empty;

        [ObservableProperty]
        private bool _useGisMode = false;

        [ObservableProperty]
        private int _totalPlansCount;

        [ObservableProperty]
        private int _totalItemsCount;

        public Task InitializeAsync()
        {
            GenerateScript();
            return Task.CompletedTask;
        }

        partial void OnRawInputChanged(string value) => GenerateScript();
        partial void OnUseGisModeChanged(bool value) => GenerateScript();

        [RelayCommand]
        public void GenerateScript()
        {
            if (string.IsNullOrWhiteSpace(RawInput))
            {
                GeneratedSql = "-- Paste data containing InspectionPlanId, QuestionInspectionId, PlotId, or GISID";
                TotalPlansCount = 0;
                TotalItemsCount = 0;
                return;
            }

            var lines = RawInput.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim())
                .Where(l => !string.IsNullOrEmpty(l))
                .ToList();

            if (lines.Count == 0) return;

            char delimiter = '\t';
            if (lines[0].Contains('\t')) delimiter = '\t';
            else if (lines[0].Contains(',')) delimiter = ',';
            else if (lines[0].Contains(';')) delimiter = ';';

            var firstLine = lines[0];
            bool hasHeader = firstLine.IndexOf("plan", StringComparison.OrdinalIgnoreCase) >= 0 ||
                             firstLine.IndexOf("question", StringComparison.OrdinalIgnoreCase) >= 0 ||
                             firstLine.IndexOf("plot", StringComparison.OrdinalIgnoreCase) >= 0 ||
                             firstLine.IndexOf("gis", StringComparison.OrdinalIgnoreCase) >= 0;

            int startIdx = hasHeader ? 1 : 0;

            // Check if QuestionInspectionId pattern
            bool hasQiCol = firstLine.IndexOf("question", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            lines.Any(l => l.Contains("9808165"));

            if (hasQiCol)
            {
                var attached = new Dictionary<string, HashSet<string>>();
                var direct = new HashSet<string>();

                for (int i = startIdx; i < lines.Count; i++)
                {
                    var parts = lines[i].Split(delimiter).Select(p => p.Trim().Trim('"')).ToArray();
                    if (parts.Length == 0) continue;

                    string col1 = parts[0];
                    string col2 = parts.Length > 1 ? parts[1] : string.Empty;

                    if (!string.IsNullOrEmpty(col1) && !string.IsNullOrEmpty(col2))
                    {
                        if (!attached.ContainsKey(col1)) attached[col1] = new HashSet<string>();
                        attached[col1].Add(col2);
                    }
                    else if (!string.IsNullOrEmpty(col1))
                    {
                        direct.Add(col1);
                    }
                }

                var sbQi = new StringBuilder();
                sbQi.AppendLine("-- Auto-Generated Delete Script: QuestionInspectionId Mode");
                int itemCount = 0;

                foreach (var kvp in attached)
                {
                    string planId = kvp.Key;
                    var ids = kvp.Value.ToList();
                    itemCount += ids.Count;
                    string inClause = string.Join(", ", ids);

                    sbQi.AppendLine("DELETE QuestionInspection");
                    sbQi.AppendLine("WHERE InspectionPlanCenterId IN (");
                    sbQi.AppendLine(string.Format("    SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = {0}", planId));
                    sbQi.AppendLine(")");
                    sbQi.AppendLine(string.Format("AND Id IN ({0});\n", inClause));
                }

                if (direct.Count > 0)
                {
                    itemCount += direct.Count;
                    foreach (var id in direct)
                    {
                        sbQi.AppendLine("delete QuestionInspection\n");
                        sbQi.AppendLine(string.Format("where id= {0};\n", id));
                    }
                }

                TotalPlansCount = attached.Count;
                TotalItemsCount = itemCount;
                GeneratedSql = sbQi.ToString();
                return;
            }

            var groups = new Dictionary<string, (HashSet<string> PlotIds, HashSet<string> GisIds)>();

            for (int i = startIdx; i < lines.Count; i++)
            {
                var parts = lines[i].Split(delimiter).Select(p => p.Trim().Trim('"')).ToArray();
                if (parts.Length < 2) continue;

                string planId = parts[0];
                string val = parts[1];
                string gisVal = parts.Length > 2 ? parts[2] : string.Empty;

                if (!groups.ContainsKey(planId))
                {
                    groups[planId] = (new HashSet<string>(), new HashSet<string>());
                }

                if (!string.IsNullOrEmpty(val)) groups[planId].PlotIds.Add(val);
                if (!string.IsNullOrEmpty(gisVal)) groups[planId].GisIds.Add(gisVal);
            }

            TotalPlansCount = groups.Count;
            int totalItems = 0;

            var sb = new StringBuilder();
            sb.AppendLine("-- =================================================================");
            sb.AppendLine("-- Generated Delete Script: Delete Plots/GISIDs from Plans");
            sb.AppendLine("-- Mode: " + (UseGisMode ? "InspectionPlanId + GISID" : "InspectionPlanId + PlotId"));
            sb.AppendLine("-- =================================================================\n");

            foreach (var kvp in groups)
            {
                string planId = kvp.Key;
                var plotList = kvp.Value.PlotIds.ToList();
                var gisList = kvp.Value.GisIds.ToList();

                if (UseGisMode)
                {
                    var listToUse = gisList.Count > 0 ? gisList : plotList;
                    totalItems += listToUse.Count;
                    if (listToUse.Count == 0) continue;

                    string inClause = string.Join(", ", listToUse.Select(g => "'" + g.Replace("'", "''") + "'"));

                    sb.AppendLine(string.Format("-- Delete {0} GISID Plot(s) for Inspection Plan ID: {1}", listToUse.Count, planId));
                    sb.AppendLine("Delete q from QuestionInspection q");
                    sb.AppendLine("inner join center c on q.plotid = c.id");
                    sb.AppendLine("where InspectionPlanCenterId in (");
                    sb.AppendLine(string.Format("    select ID from InspectionPlanCenter where InspectionPlanId = {0}", planId));
                    sb.AppendLine(")");
                    sb.AppendLine(string.Format("and c.GISID in ({0});\n", inClause));
                }
                else
                {
                    totalItems += plotList.Count;
                    if (plotList.Count == 0) continue;

                    string inClause = string.Join(", ", plotList);

                    sb.AppendLine(string.Format("-- Delete {0} Plot(s) for Inspection Plan ID: {1}", plotList.Count, planId));
                    sb.AppendLine("Delete QuestionInspection where InspectionPlanCenterId in (");
                    sb.AppendLine(string.Format("    select ID from InspectionPlanCenter where InspectionPlanId = {0}", planId));
                    sb.AppendLine(")");
                    sb.AppendLine(string.Format("and PlotId in ({0});\n", inClause));
                }
            }

            TotalItemsCount = totalItems;
            GeneratedSql = sb.ToString();
        }

        [RelayCommand]
        public void CopyToClipboard()
        {
            if (!string.IsNullOrEmpty(GeneratedSql))
            {
                Clipboard.SetText(GeneratedSql);
            }
        }

        [RelayCommand]
        public void Clear()
        {
            RawInput = string.Empty;
        }
    }
}`
  },
  {
    path: 'Features/DeletePlots/Views/DeletePlotsView.xaml',
    name: 'DeletePlotsView.xaml',
    language: 'xml',
    content: `<UserControl x:Class="SupportToolkit.Features.DeletePlots.Views.DeletePlotsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="1000">
    <Grid Margin="10">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="*"/>
            <ColumnDefinition Width="260"/>
            <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

        <Border Grid.Column="0" Background="#252526" CornerRadius="4" Padding="10" Margin="0,0,5,0">
            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <TextBlock Text="Input Data (InspectionPlanId, PlotId, GISID)" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,8"/>
                <TextBox Grid.Row="1" Text="{Binding RawInput, UpdateSourceTrigger=PropertyChanged}"
                         AcceptsReturn="True" TextWrapping="Wrap"
                         Background="#1E1E1E" Foreground="#E0E0E0" FontFamily="Consolas"
                         Padding="8" BorderBrush="#3F3F46"/>
                <Button Grid.Row="2" Content="Clear Data" Command="{Binding ClearCommand}" Style="{StaticResource SecondaryButton}" Margin="0,8,0,0"/>
            </Grid>
        </Border>

        <Border Grid.Column="1" Background="#252526" CornerRadius="4" Padding="12" Margin="5,0,5,0">
            <StackPanel>
                <TextBlock Text="Query Mode Settings" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,12"/>
                
                <RadioButton Content="InspectionPlanId + PlotId" IsChecked="{Binding UseGisMode, Converter={StaticResource InverseBoolConverter}, Mode=TwoWay}" Foreground="#E0E0E0" Margin="0,6"/>
                <RadioButton Content="InspectionPlanId + GISID" IsChecked="{Binding UseGisMode}" Foreground="#E0E0E0" Margin="0,6"/>

                <Separator Background="#3F3F46" Margin="0,15"/>

                <TextBlock Text="Parsed Plan Summary" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,8"/>
                <TextBlock Text="{Binding TotalPlansCount, StringFormat='Total Plans: {0}'}" Foreground="#007ACC" FontWeight="Bold" Margin="0,2"/>
                <TextBlock Text="{Binding TotalItemsCount, StringFormat='Total Plots/GISIDs: {0}'}" Foreground="#4EC9B0" FontWeight="Bold" Margin="0,2"/>
            </StackPanel>
        </Border>

        <Border Grid.Column="2" Background="#252526" CornerRadius="4" Padding="10" Margin="5,0,0,0">
            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <TextBlock Text="Generated DELETE SQL Script" Foreground="#CCCCCC" FontWeight="Bold" Margin="0,0,0,8"/>
                <TextBox Grid.Row="1" Text="{Binding GeneratedSql, Mode=OneWay}" IsReadOnly="True"
                         AcceptsReturn="True" TextWrapping="Wrap"
                         Background="#1E1E1E" Foreground="#4EC9B0" FontFamily="Consolas"
                         Padding="8" BorderBrush="#3F3F46"/>
                <Button Grid.Row="2" Content="Copy SQL Script" Command="{Binding CopyToClipboardCommand}"
                        Style="{StaticResource PrimaryButton}" Margin="0,8,0,0"/>
            </Grid>
        </Border>
    </Grid>
</UserControl>`
  },
  {
    path: 'Features/DeletePlots/Views/DeletePlotsView.xaml.cs',
    name: 'DeletePlotsView.xaml.cs',
    language: 'csharp',
    content: `using System.Windows.Controls;

namespace SupportToolkit.Features.DeletePlots.Views
{
    public partial class DeletePlotsView : UserControl
    {
        public DeletePlotsView()
        {
            InitializeComponent();
        }
    }
}`
  },
  {
    path: 'ViewModels/MainWindowViewModel.cs',
    name: 'MainWindowViewModel.cs',
    language: 'csharp',
    content: `using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SupportToolkit.Core.Interfaces;

namespace SupportToolkit.ViewModels
{
    public partial class MainWindowViewModel : ObservableObject
    {
        private readonly INavigationService _navigationService;

        [ObservableProperty]
        private ObservableCollection<ISupportFeature> _features = new();

        [ObservableProperty]
        private ISupportFeature? _currentFeature;

        [ObservableProperty]
        private string _statusText = "Ready";

        public MainWindowViewModel(IEnumerable<ISupportFeature> features, INavigationService navigationService)
        {
            _navigationService = navigationService;
            _navigationService.CurrentFeatureChanged += feature => CurrentFeature = feature;

            foreach (var feature in features)
            {
                Features.Add(feature);
            }

            if (Features.Any())
            {
                NavigateToFeature(Features.First());
            }
        }

        [RelayCommand]
        public void NavigateToFeature(ISupportFeature feature)
        {
            if (feature != null)
            {
                _navigationService.NavigateTo(feature);
                StatusText = "Active Module: " + feature.Title;
            }
        }
    }
}`
  },
  {
    path: 'Views/MainWindow.xaml',
    name: 'MainWindow.xaml',
    language: 'xml',
    content: `<Window x:Class="SupportToolkit.Views.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:dbViews="clr-namespace:SupportToolkit.Features.DatabaseExplorer.Views"
        xmlns:dbVm="clr-namespace:SupportToolkit.Features.DatabaseExplorer.ViewModels"
        xmlns:fmtViews="clr-namespace:SupportToolkit.Features.ListFormatter.Views"
        xmlns:fmtVm="clr-namespace:SupportToolkit.Features.ListFormatter.ViewModels"
        xmlns:delViews="clr-namespace:SupportToolkit.Features.DeletePlots.Views"
        xmlns:delVm="clr-namespace:SupportToolkit.Features.DeletePlots.ViewModels"
        xmlns:sysViews="clr-namespace:SupportToolkit.Features.SystemInfo.Views"
        xmlns:sysVm="clr-namespace:SupportToolkit.Features.SystemInfo.ViewModels"
        mc:Ignorable="d"
        Title="IT Support &amp; Database Utility Toolkit" Height="750" Width="1200"
        WindowStartupLocation="CenterScreen"
        Background="#1E1E1E">

    <Window.Resources>
        <DataTemplate DataType="{x:Type dbVm:DatabaseExplorerViewModel}">
            <dbViews:DatabaseExplorerView/>
        </DataTemplate>
        <DataTemplate DataType="{x:Type fmtVm:ListFormatterViewModel}">
            <fmtViews:ListFormatterView/>
        </DataTemplate>
        <DataTemplate DataType="{x:Type delVm:DeletePlotsViewModel}">
            <delViews:DeletePlotsView/>
        </DataTemplate>
        <DataTemplate DataType="{x:Type sysVm:SystemInfoViewModel}">
            <sysViews:SystemInfoView/>
        </DataTemplate>
    </Window.Resources>

    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="*"/>
            <RowDefinition Height="28"/>
        </Grid.RowDefinitions>

        <Grid Grid.Row="0">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="220"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>

            <Border Grid.Column="0" Background="#252526" BorderBrush="#3F3F46" BorderThickness="0,0,1,0">
                <Grid>
                    <Grid.RowDefinitions>
                        <RowDefinition Height="60"/>
                        <RowDefinition Height="*"/>
                    </Grid.RowDefinitions>

                    <StackPanel Grid.Row="0" VerticalAlignment="Center" Margin="15,0">
                        <TextBlock Text="IT Toolkit" Foreground="#FFFFFF" FontSize="18" FontWeight="Bold"/>
                        <TextBlock Text="v1.0 .NET 8" Foreground="#888888" FontSize="11"/>
                    </StackPanel>

                    <ItemsControl Grid.Row="1" ItemsSource="{Binding Features}">
                        <ItemsControl.ItemTemplate>
                            <DataTemplate>
                                <Button Command="{Binding DataContext.NavigateToFeatureCommand, RelativeSource={RelativeSource AncestorType=Window}}"
                                        CommandParameter="{Binding}"
                                        Style="{StaticResource NavButton}">
                                    <StackPanel Orientation="Horizontal" Margin="10,0">
                                        <TextBlock Text="{Binding Icon}" FontSize="16" Margin="0,0,10,0"/>
                                        <TextBlock Text="{Binding Title}" FontSize="13" VerticalAlignment="Center"/>
                                    </StackPanel>
                                </Button>
                            </DataTemplate>
                        </ItemsControl.ItemTemplate>
                    </ItemsControl>
                </Grid>
            </Border>

            <ContentControl Grid.Column="1" Content="{Binding CurrentFeature}"/>
        </Grid>

        <StatusBar Grid.Row="1" Background="#007ACC" Foreground="#FFFFFF">
            <StatusBarItem>
                <TextBlock Text="{Binding StatusText}" FontSize="12"/>
            </StatusBarItem>
        </StatusBar>
    </Grid>
</Window>`
  },
  {
    path: 'Views/MainWindow.xaml.cs',
    name: 'MainWindow.xaml.cs',
    language: 'csharp',
    content: `using System.Windows;
using SupportToolkit.ViewModels;

namespace SupportToolkit.Views
{
    public partial class MainWindow : Window
    {
        public MainWindow(MainWindowViewModel viewModel)
        {
            InitializeComponent();
            DataContext = viewModel;
        }
    }
}`
  }
];
