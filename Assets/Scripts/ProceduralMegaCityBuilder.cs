using UnityEngine;

public sealed class ProceduralMegaCityBuilder : MonoBehaviour
{
    [SerializeField] private Material groundMaterial;
    [SerializeField] private Material roadMaterial;
    [SerializeField] private Material glassMaterial;
    [SerializeField] private Material landmarkMaterial;

    [ContextMenu("Build Mega City Layout")]
    public void Build()
    {
        if (GameObject.Find("MegaCityGenerated") == null)
            new GameObject("MegaCityGenerated");
        CreatePrimitive("Ground", PrimitiveType.Plane, Vector3.zero, new Vector3(90f, 1f, 90f), groundMaterial);
        CreatePrimitive("River", PrimitiveType.Cube, new Vector3(0f, -0.1f, 0f), new Vector3(550f, 0.2f, 28f), glassMaterial);

        CreateRoad("NorthSouthRoadA", new Vector3(35f, 0.2f, 0f), new Vector3(16f, 0.4f, 500f));
        CreateRoad("NorthSouthRoadB", new Vector3(-35f, 0.2f, 0f), new Vector3(16f, 0.4f, 500f));
        CreateRoad("EastWestRoadA", new Vector3(0f, 0.2f, -70f), new Vector3(500f, 0.4f, 16f));
        CreateRoad("EastWestRoadB", new Vector3(0f, 0.2f, 70f), new Vector3(500f, 0.4f, 16f));

        CreateLandmark("ShanghaiTower", new Vector3(-14f, 40f, 0f), new Vector3(12f, 80f, 12f));
        CreateLandmark("PetronasTowerA", new Vector3(7f, 31f, 0f), new Vector3(8f, 62f, 8f));
        CreateLandmark("PetronasTowerB", new Vector3(21f, 31f, 0f), new Vector3(8f, 62f, 8f));
        CreateLandmark("EmpireStateBuilding", new Vector3(0f, 48f, -58f), new Vector3(20f, 96f, 18f));
        CreateLandmark("University", new Vector3(-125f, 8f, -145f), new Vector3(52f, 16f, 42f));
        CreateLandmark("Hospital", new Vector3(85f, 18f, -110f), new Vector3(62f, 36f, 58f));
        CreateLandmark("ShoppingMall", new Vector3(-85f, 16f, 110f), new Vector3(42f, 32f, 42f));
        CreateLandmark("Factory", new Vector3(85f, 12f, 110f), new Vector3(48f, 24f, 42f));
        CreateLandmark("ThemePark", new Vector3(180f, 0f, 150f), new Vector3(80f, 0.2f, 80f));
    }

    private void CreateRoad(string name, Vector3 position, Vector3 scale)
    {
        CreatePrimitive(name, PrimitiveType.Cube, position, scale, roadMaterial);
    }

    private void CreateLandmark(string name, Vector3 position, Vector3 scale)
    {
        CreatePrimitive(name, PrimitiveType.Cube, position, scale, landmarkMaterial);
    }

    private static GameObject CreatePrimitive(string name, PrimitiveType type, Vector3 position, Vector3 scale, Material material)
    {
        var obj = GameObject.CreatePrimitive(type);
        obj.name = name;
        var root = GameObject.Find("MegaCityGenerated");
        if (root != null)
            obj.transform.SetParent(root.transform);
        obj.transform.position = position;
        obj.transform.localScale = scale;
        if (material != null)
            obj.GetComponent<Renderer>().sharedMaterial = material;
        return obj;
    }
}
