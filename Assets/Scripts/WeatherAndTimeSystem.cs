using UnityEngine;

public sealed class WeatherAndTimeSystem : MonoBehaviour
{
    [SerializeField] private Light sun;
    [SerializeField] private ParticleSystem rain;
    [SerializeField] private ParticleSystem snow;
    [SerializeField] private ParticleSystem springPetals;
    [SerializeField] private ParticleSystem autumnLeaves;
    [SerializeField] private ParticleSystem lateAutumnLeaves;
    [SerializeField] private float cycleDuration = 720f;
    [SerializeField] private Gradient skyGradient;

    private AiEvent aiEvent = AiEvent.NORMAL;
    private float elapsed;
    private Camera sceneCamera;

    public bool IsNight { get; private set; }
    public AiEvent CurrentEvent => aiEvent;

    private void Awake()
    {
        sceneCamera = Camera.main;
        if (skyGradient == null || skyGradient.colorKeys.Length == 0)
            skyGradient = CreateDefaultSkyGradient();
    }

    private void Update()
    {
        elapsed = (elapsed + Time.deltaTime) % cycleDuration;
        var progress = elapsed / cycleDuration;
        var angle = progress * Mathf.PI * 2f;
        var sunPosition = new Vector3(Mathf.Cos(angle) * 520f, Mathf.Sin(angle) * 520f, Mathf.Sin(angle * 0.5f) * 260f);

        if (sun != null)
        {
            sun.transform.position = sunPosition;
            sun.transform.LookAt(Vector3.zero);
            sun.intensity = Mathf.Lerp(0.18f, 2.5f, Mathf.Clamp01(sunPosition.y / 120f));
        }

        IsNight = sunPosition.y < 0f;
        var skyColor = skyGradient.Evaluate(Mathf.Clamp01((sunPosition.y + 520f) / 1040f));
        if (RenderSettings.skybox != null && RenderSettings.skybox.HasProperty("_Tint"))
            RenderSettings.skybox.SetColor("_Tint", skyColor);
        RenderSettings.ambientLight = Color.Lerp(new Color(0.03f, 0.03f, 0.08f), Color.white, Mathf.Clamp01((sunPosition.y + 60f) / 180f));
        if (sceneCamera != null)
            sceneCamera.backgroundColor = skyColor;
    }

    public void SetAiEvent(AiEvent nextEvent)
    {
        aiEvent = nextEvent;
        SetParticles(rain, nextEvent == AiEvent.RAIN_STORM);
        SetParticles(snow, nextEvent == AiEvent.WINTER || nextEvent == AiEvent.SNOWFALL);
        SetParticles(springPetals, nextEvent == AiEvent.SPRING);
        SetParticles(autumnLeaves, nextEvent == AiEvent.AUTUMN);
        SetParticles(lateAutumnLeaves, nextEvent == AiEvent.LATE_AUTUMN);
    }

    private static void SetParticles(ParticleSystem particles, bool enabled)
    {
        if (particles == null)
            return;

        if (enabled && !particles.isPlaying)
            particles.Play();
        else if (!enabled && particles.isPlaying)
            particles.Stop();
    }

    private static Gradient CreateDefaultSkyGradient()
    {
        var gradient = new Gradient();
        gradient.SetKeys(
            new[] { new GradientColorKey(new Color(0.01f, 0.01f, 0.04f), 0f), new GradientColorKey(new Color(0.53f, 0.81f, 0.92f), 1f) },
            new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) });
        return gradient;
    }
}
