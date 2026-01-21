# test_simple_db.py - SIMPLE database connection test
print("🔌 Testing Database Connection to YOUR Table...")
print("=" * 60)

try:
    import pyodbc
    import pandas as pd
    
    print("✅ Libraries loaded")
    
    # Use THIS connection string (simplified from your Node.js)
    # Your Node.js worked with: np:\\\\.\\pipe\\LOCALDB#22B4B685\\tsql\\query
    conn_str = (
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'SERVER=np:\\\\\\.\\\\pipe\\\\LOCALDB#22B4B685\\\\tsql\\\\query;'
        'DATABASE=TestSlimDB;'
        'Trusted_Connection=yes;'
    )
    
    print(f"🔗 Connecting with string: {conn_str}")
    
    # Connect
    conn = pyodbc.connect(conn_str)
    print("✅ Connected to SQL Server!")
    
    # Create cursor
    cursor = conn.cursor()
    
    # TEST 1: Your exact query
    print("\n📊 TEST 1: Running YOUR query...")
    query = """
    SELECT TOP (50) [seq], [ts], [value]
    FROM [TestSlimDB].[dbo].[SaitSolarLab_30000_TL212]
    ORDER BY [ts] DESC
    """
    
    print(f"Query: {query[:100]}...")
    
    # Execute
    cursor.execute(query)
    
    # Fetch results
    rows = cursor.fetchall()
    print(f"✅ SUCCESS! Retrieved {len(rows)} rows")
    
    # Show column names
    columns = [column[0] for column in cursor.description]
    print(f"Columns: {columns}")
    
    # Show first 5 rows
    print("\nFirst 5 rows:")
    for i, row in enumerate(rows[:5]):
        print(f"  Row {i+1}: seq={row[0]}, ts={row[1]}, value={row[2]}")
    
    # TEST 2: Get some stats
    print("\n📈 TEST 2: Getting data statistics...")
    stats_query = """
    SELECT 
        COUNT(*) as total_rows,
        MIN(ts) as earliest_date,
        MAX(ts) as latest_date,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value
    FROM [TestSlimDB].[dbo].[SaitSolarLab_30000_TL212]
    """
    
    cursor.execute(stats_query)
    stats = cursor.fetchone()
    
    print(f"📊 Statistics:")
    print(f"  Total rows: {stats[0]:,}")
    print(f"  Date range: {stats[1]} to {stats[2]}")
    print(f"  Average value: {stats[3]:.2f}")
    print(f"  Min value: {stats[4]:.2f}")
    print(f"  Max value: {stats[5]:.2f}")
    
    # TEST 3: Check if there are other electricity tables
    print("\n🔍 TEST 3: Looking for other electricity tables...")
    tables_query = """
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE '%30000%' 
       OR TABLE_NAME LIKE '%solar%'
       OR TABLE_NAME LIKE '%electric%'
    ORDER BY TABLE_NAME
    """
    
    cursor.execute(tables_query)
    tables = cursor.fetchall()
    
    print(f"Found {len(tables)} relevant tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Close connection
    conn.close()
    print("\n" + "=" * 60)
    print("🎉 DATABASE TEST COMPLETE!")
    print("✅ Connection works!")
    print("✅ Your query works!")
    print("✅ Data is available for training!")
    
except pyodbc.InterfaceError as e:
    print(f"❌ ODBC Driver Error: {e}")
    print("\n💡 Install ODBC Driver 17 for SQL Server")
    print("   Download: https://go.microsoft.com/fwlink/?linkid=2241961")
    
except pyodbc.OperationalError as e:
    print(f"❌ Connection Error: {e}")
    print("\n💡 Trying alternative connection string...")
    
    # Try alternative
    try:
        alt_conn_str = (
            'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=(localdb)\\MSSQLLocalDB;'
            'DATABASE=TestSlimDB;'
            'Trusted_Connection=yes;'
        )
        
        print(f"\nTrying: {alt_conn_str}")
        conn = pyodbc.connect(alt_conn_str)
        print("✅ Connected with alternative!")
        conn.close()
        
    except Exception as e2:
        print(f"❌ Also failed: {e2}")
        
except ImportError:
    print("❌ pyodbc not installed. Run: pip install pyodbc")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()