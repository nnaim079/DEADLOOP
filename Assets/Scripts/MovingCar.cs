using UnityEngine;

public sealed class MovingCar : MonoBehaviour
{
    [SerializeField] private float speed = 20f;
    [SerializeField] private int direction = 1;
    [SerializeField] private bool boundaryLane;
    [SerializeField] private string axis = "z";

    private void Update()
    {
        var distance = speed * direction * Time.deltaTime;
        if (axis == "z")
            transform.position += new Vector3(0f, 0f, distance);
        else
            transform.position += new Vector3(distance, 0f, 0f);

        var limit = boundaryLane ? 248f : 240f;
        var coordinate = axis == "z" ? transform.position.z : transform.position.x;
        if (coordinate > limit || coordinate < -limit)
        {
            var position = transform.position;
            if (axis == "z")
                position.z = coordinate > limit ? -limit : limit;
            else
                position.x = coordinate > limit ? -limit : limit;
            transform.position = position;
        }
    }
}
