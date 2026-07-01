package exchanges

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

func getJSON(ctx context.Context, client *http.Client, url string, target any) error {
	return getJSONWithHeaders(ctx, client, url, nil, target)
}

func getJSONWithHeaders(ctx context.Context, client *http.Client, url string, headers map[string]string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "arbitrase-price-worker/1.0")
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("unexpected status %d", res.StatusCode)
	}

	return json.NewDecoder(res.Body).Decode(target)
}
