module.exports = {
  VCAP_SERVICES: JSON.stringify({
    "watson_vision_combined": [
        {
            "credentials": {
                "url": "https://gateway-a.watsonplatform.net/visual-recognition/api",
                "api_key": "b44887211c1db31fa66426ef595872b2890fb796"
            },
            "syslog_drain_url": null,
            "volume_mounts": [],
            "label": "watson_vision_combined",
            "provider": null,
            "plan": "free",
            "name": "vr-service-1",
            "tags": [
                "watson",
                "ibm_created",
                "ibm_dedicated_public"
            ]
        }
    ]
  }),
  "classifier_id": "fruit_689697867"
};
