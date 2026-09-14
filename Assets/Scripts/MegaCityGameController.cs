using UnityEngine;

public enum AiEvent
{
    NORMAL, RAIN_STORM, AUTUMN, LATE_AUTUMN, WINTER, SNOWFALL, SPRING, SUMMER
}

public sealed class MegaCityGameController : MonoBehaviour
{
    [Header("World references")]
    [SerializeField] private Transform player;
    [SerializeField] private GameObject bulletPrefab;
    [SerializeField] private WeatherAndTimeSystem weather;

    [Header("Gameplay")]
    [SerializeField] private float playerStep = 1.2f;
    [SerializeField] private float bulletSpeed = 35f;
    [SerializeField] private float bulletLifetime = 12f;
    [SerializeField] private float seasonDuration = 120f;

    private readonly AiEvent[] seasonCycle =
    {
        AiEvent.NORMAL, AiEvent.RAIN_STORM, AiEvent.AUTUMN, AiEvent.LATE_AUTUMN,
        AiEvent.WINTER, AiEvent.SNOWFALL, AiEvent.SPRING, AiEvent.SUMMER
    };

    private int seasonIndex;
    private float seasonTimer;

    public AiEvent CurrentEvent { get; private set; } = AiEvent.NORMAL;
    public bool IsNight => weather != null && weather.IsNight;

    private void Start()
    {
        SetAiEvent(seasonCycle[0]);
    }

    private void Update()
    {
        UpdateSeason();
        MovePlayer();

        if (Input.GetKeyDown(KeyCode.Space))
            Fire();
    }

    private void UpdateSeason()
    {
        seasonTimer += Time.deltaTime;
        if (seasonTimer < seasonDuration)
            return;

        seasonTimer = 0f;
        seasonIndex = (seasonIndex + 1) % seasonCycle.Length;
        SetAiEvent(seasonCycle[seasonIndex]);
    }

    private void SetAiEvent(AiEvent nextEvent)
    {
        CurrentEvent = nextEvent;
        if (weather != null)
            weather.SetAiEvent(nextEvent);
    }

    private void MovePlayer()
    {
        if (player == null)
            return;

        var input = new Vector3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"));
        if (input.sqrMagnitude > 1f)
            input.Normalize();

        player.position += input * playerStep * Time.deltaTime * 60f;
        player.position = new Vector3(
            Mathf.Clamp(player.position.x, -180f, 180f),
            player.position.y,
            Mathf.Clamp(player.position.z, -180f, 180f));
    }

    private void Fire()
    {
        if (player == null || bulletPrefab == null)
            return;

        var bullet = Instantiate(
            bulletPrefab,
            player.position + new Vector3(0f, 1.2f, -0.5f),
            Quaternion.identity);

        var body = bullet.GetComponent<Rigidbody>();
        if (body != null)
            body.velocity = Vector3.back * bulletSpeed;

        Destroy(bullet, bulletLifetime);
    }
}
