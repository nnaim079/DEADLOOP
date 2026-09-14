using UnityEngine;

public sealed class AmbientAudioController : MonoBehaviour
{
    [SerializeField] private AudioSource birds;
    [SerializeField] private AudioSource rain;
    [SerializeField] private AudioSource cars;
    [SerializeField] private WeatherAndTimeSystem weather;

    private void Start()
    {
        PlayLoop(cars);
        ApplyAudioState();
    }

    private void Update()
    {
        ApplyAudioState();
    }

    private void ApplyAudioState()
    {
        if (weather == null)
            return;

        var raining = weather.CurrentEvent == AiEvent.RAIN_STORM;
        SetLoop(rain, raining);
        SetLoop(birds, !raining && !weather.IsNight);
        SetLoop(cars, true);
    }

    private static void PlayLoop(AudioSource source)
    {
        if (source == null)
            return;
        source.loop = true;
        if (!source.isPlaying)
            source.Play();
    }

    private static void SetLoop(AudioSource source, bool shouldPlay)
    {
        if (source == null)
            return;

        if (shouldPlay)
            PlayLoop(source);
        else if (source.isPlaying)
            source.Pause();
    }
}
