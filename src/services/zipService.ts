import JSZip from 'jszip';
import { csharpSolutionFiles } from '../data/csharpSolutionFiles';

export async function downloadCSharpSolutionZip(): Promise<void> {
  const zip = new JSZip();

  // Add all files from csharpSolutionFiles array
  for (const file of csharpSolutionFiles) {
    zip.file(file.path, file.content);
  }

  // Also add README.md explaining how to build in Visual Studio 2022 / .NET 8 CLI
  const readmeContent = `# SupportToolkit - IT Support & Database Utility Toolkit (.NET 8 WPF)

This is a production-ready C# WPF Desktop Application built with .NET 8, MVVM CommunityToolkit, Dapper, Microsoft.Data.SqlClient, and Serilog.

## How to Build & Run:

1. Open \`SupportToolkit.sln\` in Visual Studio 2022 (version 17.8+ with .NET 8 SDK installed) or JetBrains Rider.
2. Run \`dotnet restore\` in the terminal to restore all NuGet dependencies:
   - CommunityToolkit.Mvvm (v8.2.2)
   - Dapper (v2.1.35)
   - Microsoft.Data.SqlClient (v5.2.0)
   - Microsoft.Extensions.DependencyInjection (v8.0.0)
   - Serilog (v3.1.1)
   - System.Management (v8.0.0)
   - System.Security.Cryptography.ProtectedData (v8.0.0)
3. Press **F5** or click **Start** in Visual Studio to compile and run the application!

## Features:
- **Database Explorer**: Full SQL Server connection manager with local Windows ProtectedData password encryption, schema browser treeview, multi-tab SQL Editor, CSV export, and execution history log.
- **System Diagnostics**: Real-time system hardware, OS, runtime, and IP address diagnostic panel.
- **Extensible Architecture**: \`ISupportFeature\` modular plugin system powered by \`Microsoft.Extensions.DependencyInjection\`.
`;

  zip.file('README.md', readmeContent);

  // Generate blob and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'SupportToolkit_NET8_WPF_Solution.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
